<?php
session_start();
require_once 'config.php';
require_once 'session_helpers.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}


function calculate_partial_credit_score(int $correctParts, int $totalParts, ?int $responseTimeMs, int $timeLimitSeconds): int
{
    if ($totalParts <= 0 || $correctParts <= 0) {
        return 0;
    }

    $ratio = min(1, max(0, $correctParts / $totalParts));
    $baseScore = (int) round($ratio * 700);
    $speedBonus = 0;

    if ($responseTimeMs !== null && $timeLimitSeconds > 0) {
        $timeLimitMs = $timeLimitSeconds * 1000;
        $clampedResponseMs = max(0, min($responseTimeMs, $timeLimitMs));
        $speedBonus = (int) round((($timeLimitMs - $clampedResponseMs) / $timeLimitMs) * 300);
    }

    return min(1000, $baseScore + $speedBonus);
}

$data = json_decode(file_get_contents('php://input'), true);
$participantToken = trim((string) ($data['participantToken'] ?? $_POST['participantToken'] ?? ''));
$questionId = (int) ($data['questionId'] ?? $_POST['questionId'] ?? 0);
$selectedOptionIndexRaw = $data['selectedOptionIndex'] ?? $_POST['selectedOptionIndex'] ?? null;
$selectedOptionIndex = $selectedOptionIndexRaw === null || $selectedOptionIndexRaw === ''
    ? null
    : (int) $selectedOptionIndexRaw;
$responseData = $data['responseData'] ?? null;

if (
    $participantToken === '' ||
    $questionId <= 0 ||
    ($selectedOptionIndex !== null && ($selectedOptionIndex < 0 || $selectedOptionIndex > 3))
) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid answer payload']);
    exit;
}

$participantStmt = $pdo->prepare(
    'SELECT
        sp.id,
        sp.session_id,
        qs.status,
        qs.current_question_id,
        qs.question_started_at,
        sq.question_type,
        sq.time_limit_seconds,
        sq.answer_key_json
     FROM session_participants sp
     INNER JOIN quiz_sessions qs ON qs.id = sp.session_id
     INNER JOIN session_questions sq ON sq.id = qs.current_question_id
     WHERE sp.join_token = ?
     LIMIT 1'
);
$participantStmt->execute([$participantToken]);
$participant = $participantStmt->fetch();

if (!$participant) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Participant not found']);
    exit;
}

if ($participant['status'] !== 'active') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Session is not accepting answers']);
    exit;
}

if ((int) $participant['current_question_id'] !== $questionId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'This question is no longer active']);
    exit;
}

$existingAnswerStmt = $pdo->prepare(
    'SELECT id FROM participant_answers WHERE question_id = ? AND participant_id = ? LIMIT 1'
);
$existingAnswerStmt->execute([$questionId, (int) $participant['id']]);
if ($existingAnswerStmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'error' => 'Answer already submitted']);
    exit;
}

$questionType = $participant['question_type'] ?: 'multiple_choice';
$answerKey = decode_json_array($participant['answer_key_json'] ?? null);
$timeLimitSeconds = max(1, (int) $participant['time_limit_seconds']);
$responseTimeMs = calculate_response_time_ms(
    $participant['question_started_at'] !== null ? (string) $participant['question_started_at'] : null,
    $timeLimitSeconds
);
$timedOut = $responseTimeMs !== null && $responseTimeMs >= ($timeLimitSeconds * 1000);

$selectedOptionId = null;
$storedResponseJson = null;
$isCorrect = false;
$scoreAwarded = 0;
$maxScore = 1000;
$correctParts = 0;
$totalParts = 1;
$labelResults = [];
$matchingResults = [];

if ($questionType === 'multiple_choice') {
    $option = null;

    if ($timedOut && $selectedOptionIndex !== null) {
        $selectedOptionIndex = null;
    }

    if ($selectedOptionIndex !== null) {
        $optionStmt = $pdo->prepare(
            'SELECT id, is_correct
             FROM question_options
             WHERE question_id = ? AND display_order = ?
             LIMIT 1'
        );
        $optionStmt->execute([$questionId, $selectedOptionIndex + 1]);
        $option = $optionStmt->fetch();

        if (!$option) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid option selected']);
            exit;
        }
    }

    $selectedOptionId = $option ? (int) $option['id'] : null;
    $isCorrect = $option ? (int) $option['is_correct'] === 1 : false;
    $scoreAwarded = calculate_question_score($isCorrect, $responseTimeMs, $timeLimitSeconds);
} elseif ($questionType === 'sorting') {
    $items = is_array($responseData) && isset($responseData['items']) && is_array($responseData['items'])
        ? array_values(array_map('strval', $responseData['items']))
        : [];
    $correctOrder = isset($answerKey['correctOrder']) && is_array($answerKey['correctOrder'])
        ? array_values(array_map('strval', $answerKey['correctOrder']))
        : [];

    if ($timedOut) {
        $items = [];
    }

    $storedResponseJson = count($items) > 0
        ? json_encode(['items' => $items], JSON_UNESCAPED_UNICODE)
        : null;
    $isCorrect = count($items) > 0 && $items === $correctOrder;
    $scoreAwarded = calculate_question_score($isCorrect, $responseTimeMs, $timeLimitSeconds);
} elseif ($questionType === 'label_image') {
    $labelsResponse = is_array($responseData) && isset($responseData['labels']) && is_array($responseData['labels'])
        ? $responseData['labels']
        : [];
    $expectedLabels = isset($answerKey['labels']) && is_array($answerKey['labels']) ? $answerKey['labels'] : [];

    if ($timedOut) {
        $labelsResponse = [];
    }

    $storedResponseJson = count($labelsResponse) > 0
        ? json_encode(['labels' => $labelsResponse], JSON_UNESCAPED_UNICODE)
        : null;
    $totalParts = count($expectedLabels);

    foreach ($expectedLabels as $expectedLabel) {
        if (!is_array($expectedLabel)) {
            continue;
        }

        $labelId = (string) ($expectedLabel['id'] ?? '');
        $acceptedAnswers = isset($expectedLabel['acceptedAnswers']) && is_array($expectedLabel['acceptedAnswers'])
            ? $expectedLabel['acceptedAnswers']
            : [];
        $submittedRawAnswer = isset($labelsResponse[$labelId]) ? trim((string) $labelsResponse[$labelId]) : '';
        $submittedAnswer = $submittedRawAnswer !== '' ? normalize_free_text_answer($submittedRawAnswer) : '';
        $matched = false;
        $cleanAcceptedAnswers = [];

        foreach ($acceptedAnswers as $acceptedAnswer) {
            $cleanAcceptedAnswer = trim((string) $acceptedAnswer);
            if ($cleanAcceptedAnswer === '') {
                continue;
            }

            $cleanAcceptedAnswers[] = $cleanAcceptedAnswer;
            if ($submittedAnswer !== '' && $submittedAnswer === normalize_free_text_answer($cleanAcceptedAnswer)) {
                $matched = true;
            }
        }

        $labelResults[$labelId] = [
            'submitted' => $submittedRawAnswer,
            'isCorrect' => $matched,
            'acceptedAnswers' => $cleanAcceptedAnswers,
        ];

        if ($matched) {
            $correctParts++;
        }
    }

    $isCorrect = $totalParts > 0 && $correctParts === $totalParts;
    $scoreAwarded = calculate_partial_credit_score($correctParts, $totalParts, $responseTimeMs, $timeLimitSeconds);
} elseif ($questionType === 'matching') {
    $submittedMatches = is_array($responseData) && isset($responseData['matches']) && is_array($responseData['matches'])
        ? $responseData['matches']
        : [];
    $expectedPairs = isset($answerKey['pairs']) && is_array($answerKey['pairs']) ? $answerKey['pairs'] : [];

    if ($timedOut) {
        $submittedMatches = [];
    }

    $storedResponseJson = count($submittedMatches) > 0
        ? json_encode(['matches' => $submittedMatches], JSON_UNESCAPED_UNICODE)
        : null;
    $totalParts = count($expectedPairs);
    $pairLookup = [];

    foreach ($expectedPairs as $expectedPair) {
        if (!is_array($expectedPair)) {
            continue;
        }

        $pairId = (string) ($expectedPair['id'] ?? '');
        if ($pairId !== '') {
            $pairLookup[$pairId] = $expectedPair;
        }
    }

    foreach ($expectedPairs as $expectedPair) {
        if (!is_array($expectedPair)) {
            continue;
        }

        $pairId = (string) ($expectedPair['id'] ?? '');
        $correctRightText = trim((string) ($expectedPair['rightText'] ?? ''));
        $correctRightImageUrl = trim((string) ($expectedPair['rightImageUrl'] ?? ''));
        $selectedPairId = isset($submittedMatches[$pairId]) ? trim((string) $submittedMatches[$pairId]) : '';
        $selectedRightText = '';
        $selectedRightImageUrl = '';
        $matched = false;

        if ($selectedPairId !== '' && isset($pairLookup[$selectedPairId]) && is_array($pairLookup[$selectedPairId])) {
          $selectedRightText = trim((string) ($pairLookup[$selectedPairId]['rightText'] ?? ''));
          $selectedRightImageUrl = trim((string) ($pairLookup[$selectedPairId]['rightImageUrl'] ?? ''));
          $matched = $selectedPairId === $pairId;
        }

        $matchingResults[$pairId] = [
            'selectedPairId' => $selectedPairId !== '' ? $selectedPairId : null,
            'selectedRightText' => $selectedRightText,
            'correctRightText' => $correctRightText,
            'selectedRightLabel' => $selectedPairId !== '' && isset($pairLookup[$selectedPairId]) && is_array($pairLookup[$selectedPairId])
                ? build_matching_option_label($pairLookup[$selectedPairId])
                : '',
            'correctRightLabel' => build_matching_option_label($expectedPair),
            'selectedRightImageUrl' => $selectedRightImageUrl !== '' ? $selectedRightImageUrl : null,
            'correctRightImageUrl' => $correctRightImageUrl !== '' ? $correctRightImageUrl : null,
            'isCorrect' => $matched,
        ];

        if ($matched) {
            $correctParts++;
        }
    }

    $isCorrect = $totalParts > 0 && $correctParts === $totalParts;
    $scoreAwarded = calculate_partial_credit_score($correctParts, $totalParts, $responseTimeMs, $timeLimitSeconds);
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Unsupported question type']);
    exit;
}

try {
    $pdo->beginTransaction();

    $insertAnswer = $pdo->prepare(
        'INSERT INTO participant_answers (
            session_id,
            question_id,
            participant_id,
            selected_option_id,
            response_json,
            is_correct,
            response_time_ms,
            score_awarded,
            max_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $insertAnswer->execute([
        (int) $participant['session_id'],
        $questionId,
        (int) $participant['id'],
        $selectedOptionId,
        $storedResponseJson,
        $isCorrect ? 1 : 0,
        $responseTimeMs,
        $scoreAwarded,
        $maxScore,
    ]);

    $answerId = (int) $pdo->lastInsertId();

    if ($scoreAwarded > 0) {
        $updateScore = $pdo->prepare(
            'UPDATE session_participants
             SET total_score = total_score + ?, last_seen_at = CURRENT_TIMESTAMP
             WHERE id = ?'
        );
        $updateScore->execute([$scoreAwarded, (int) $participant['id']]);

        $insertScoreEvent = $pdo->prepare(
            'INSERT INTO session_score_events (
                session_id,
                participant_id,
                question_id,
                answer_id,
                score_delta,
                event_type
            ) VALUES (?, ?, ?, ?, ?, ?)'
        );
        $insertScoreEvent->execute([
            (int) $participant['session_id'],
            (int) $participant['id'],
            $questionId,
            $answerId,
            $scoreAwarded,
            'answer_score',
        ]);
    } else {
        $touchParticipant = $pdo->prepare(
            'UPDATE session_participants SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?'
        );
        $touchParticipant->execute([(int) $participant['id']]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'answer' => [
            'isCorrect' => $isCorrect,
            'scoreAwarded' => $scoreAwarded,
            'responseTimeMs' => $responseTimeMs,
            'timedOut' => $timedOut,
            'correctParts' => $correctParts,
            'totalParts' => $totalParts,
            'labelResults' => $questionType === 'label_image' ? $labelResults : null,
            'matchingResults' => $questionType === 'matching' ? $matchingResults : null,
        ],
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to submit answer']);
}






