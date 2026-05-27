<?php
session_start();
require_once 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON payload']);
    exit;
}

$status = $data['status'] ?? 'draft';
$allowedStatuses = ['draft', 'waiting'];

if (!in_array($status, $allowedStatuses, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid session status']);
    exit;
}

$title = trim((string) ($data['title'] ?? ''));
$description = trim((string) ($data['description'] ?? ''));
$youtubeUrl = trim((string) ($data['youtubeUrl'] ?? ''));
$thumbnailUrl = trim((string) ($data['thumbnailUrl'] ?? ''));
$introVideoUrl = trim((string) ($data['introVideoUrl'] ?? ''));
$questions = $data['questions'] ?? [];

if ($title === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Session title is required']);
    exit;
}

if (!is_array($questions) || count($questions) < 1) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'At least one question is required']);
    exit;
}

function generatePublicCode(PDO $pdo): string
{
    do {
        $code = strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM quiz_sessions WHERE public_code = ?');
        $stmt->execute([$code]);
    } while ((int) $stmt->fetchColumn() > 0);

    return $code;
}

function normalizeQuestion(array $question, int $index): array
{
    $questionType = trim((string) ($question['questionType'] ?? 'multiple_choice'));
    $text = trim((string) ($question['text'] ?? ''));
    $instructions = trim((string) ($question['instructions'] ?? ''));
    $mediaUrl = trim((string) ($question['mediaUrl'] ?? ''));
    $timer = (int) ($question['timer'] ?? 0);
    $showLeaderboardAfter = (bool) ($question['showLeaderboardAfter'] ?? true);
    $allowedQuestionTypes = ['multiple_choice', 'sorting', 'label_image', 'matching'];

    if ($text === '') {
        throw new InvalidArgumentException('Question ' . ($index + 1) . ' text is required');
    }

    if (!in_array($questionType, $allowedQuestionTypes, true)) {
        throw new InvalidArgumentException('Question ' . ($index + 1) . ' type is invalid');
    }

    $content = [];
    $answerKey = [];
    $normalizedOptions = [];

    if ($questionType === 'multiple_choice') {
        $options = $question['options'] ?? [];
        $correctAnswer = $question['correctAnswer'] ?? null;

        if (!is_array($options) || count($options) !== 4) {
            throw new InvalidArgumentException('Question ' . ($index + 1) . ' must have exactly 4 options');
        }

        foreach ($options as $optionIndex => $optionText) {
            $cleanOptionText = trim((string) $optionText);
            if ($cleanOptionText === '') {
                throw new InvalidArgumentException('Question ' . ($index + 1) . ' option ' . ($optionIndex + 1) . ' is required');
            }
            $normalizedOptions[] = $cleanOptionText;
        }

        if (!is_int($correctAnswer) && !ctype_digit((string) $correctAnswer)) {
            throw new InvalidArgumentException('Question ' . ($index + 1) . ' correct answer is invalid');
        }

        $correctAnswer = (int) $correctAnswer;
        if ($correctAnswer < 0 || $correctAnswer > 3) {
            throw new InvalidArgumentException('Question ' . ($index + 1) . ' correct answer must be between 0 and 3');
        }

        $content = ['options' => $normalizedOptions];
        $answerKey = ['correctAnswer' => $correctAnswer];
    } elseif ($questionType === 'sorting') {
        $items = $question['items'] ?? [];
        if (!is_array($items) || count($items) < 3) {
            throw new InvalidArgumentException('Question ' . ($index + 1) . ' must have at least 3 sorting items');
        }

        $normalizedItems = [];
        foreach ($items as $itemIndex => $itemText) {
            $cleanItemText = trim((string) $itemText);
            if ($cleanItemText === '') {
                throw new InvalidArgumentException('Question ' . ($index + 1) . ' sorting item ' . ($itemIndex + 1) . ' is required');
            }
            $normalizedItems[] = $cleanItemText;
        }

        $content = ['items' => $normalizedItems];
        $answerKey = ['correctOrder' => $normalizedItems];
    } elseif ($questionType === 'label_image') {
        $labels = $question['labels'] ?? [];
        if ($mediaUrl === '') {
            throw new InvalidArgumentException('Question ' . ($index + 1) . ' image URL is required');
        }

        if (!is_array($labels) || count($labels) < 1) {
            throw new InvalidArgumentException('Question ' . ($index + 1) . ' must have at least 1 image label');
        }

        $normalizedLabels = [];
        foreach ($labels as $labelIndex => $label) {
            if (!is_array($label)) {
                throw new InvalidArgumentException('Question ' . ($index + 1) . ' label ' . ($labelIndex + 1) . ' is invalid');
            }

            $labelId = trim((string) ($label['id'] ?? ''));
            $prompt = trim((string) ($label['prompt'] ?? ''));
            $marker = (int) ($label['marker'] ?? ($labelIndex + 1));
            $x = round((float) ($label['x'] ?? 50), 2);
            $y = round((float) ($label['y'] ?? 50), 2);
            $width = round((float) ($label['width'] ?? 18), 2);
            $height = round((float) ($label['height'] ?? 14), 2);
            $acceptedAnswers = $label['acceptedAnswers'] ?? [];

            if ($labelId === '') {
                $labelId = 'label_' . ($labelIndex + 1);
            }

            if ($prompt === '') {
                throw new InvalidArgumentException('Question ' . ($index + 1) . ' label ' . ($labelIndex + 1) . ' prompt is required');
            }

            if (!is_array($acceptedAnswers) || count($acceptedAnswers) < 1) {
                throw new InvalidArgumentException('Question ' . ($index + 1) . ' label ' . ($labelIndex + 1) . ' needs at least 1 accepted answer');
            }

            $normalizedAnswers = [];
            foreach ($acceptedAnswers as $answerText) {
                $cleanAnswerText = trim((string) $answerText);
                if ($cleanAnswerText !== '') {
                    $normalizedAnswers[] = $cleanAnswerText;
                }
            }

            if (count($normalizedAnswers) < 1) {
                throw new InvalidArgumentException('Question ' . ($index + 1) . ' label ' . ($labelIndex + 1) . ' accepted answers are invalid');
            }

            $normalizedLabels[] = [
                'id' => $labelId,
                'marker' => $marker,
                'x' => max(0, min(100, $x)),
                'y' => max(0, min(100, $y)),
                'width' => max(8, min(90, $width)),
                'height' => max(8, min(90, $height)),
                'prompt' => $prompt,
                'acceptedAnswers' => $normalizedAnswers,
            ];
        }

        $content = ['labels' => $normalizedLabels];
        $answerKey = ['labels' => $normalizedLabels];
    } elseif ($questionType === 'matching') {
        $pairs = $question['matchingPairs'] ?? $question['pairs'] ?? [];

        if (!is_array($pairs) || count($pairs) < 2) {
            throw new InvalidArgumentException('Question ' . ($index + 1) . ' must have at least 2 matching pairs');
        }

        $normalizedPairs = [];
        foreach ($pairs as $pairIndex => $pair) {
            if (!is_array($pair)) {
                throw new InvalidArgumentException('Question ' . ($index + 1) . ' matching pair ' . ($pairIndex + 1) . ' is invalid');
            }

            $pairId = trim((string) ($pair['id'] ?? ''));
            $leftText = trim((string) ($pair['leftText'] ?? ''));
            $leftImageUrl = trim((string) ($pair['leftImageUrl'] ?? ''));
            $rightText = trim((string) ($pair['rightText'] ?? ''));
            $rightImageUrl = trim((string) ($pair['rightImageUrl'] ?? ''));

            if ($pairId === '') {
                $pairId = 'match_' . ($pairIndex + 1);
            }

            if (($leftText === '' && $leftImageUrl === '') || ($rightText === '' && $rightImageUrl === '')) {
                throw new InvalidArgumentException('Question ' . ($index + 1) . ' matching pair ' . ($pairIndex + 1) . ' requires text or an image on both sides');
            }

            $normalizedPairs[] = [
                'id' => $pairId,
                'leftText' => $leftText,
                'leftImageUrl' => $leftImageUrl !== '' ? $leftImageUrl : null,
                'rightText' => $rightText,
                'rightImageUrl' => $rightImageUrl !== '' ? $rightImageUrl : null,
            ];
        }

        $content = ['pairs' => $normalizedPairs];
        $answerKey = ['pairs' => $normalizedPairs];
    }

    $allowedTimers = [10, 20, 30, 60, 120];
    if (!in_array($timer, $allowedTimers, true)) {
        throw new InvalidArgumentException('Question ' . ($index + 1) . ' timer is invalid');
    }

    return [
        'questionType' => $questionType,
        'text' => $text,
        'instructions' => $instructions !== '' ? $instructions : null,
        'mediaUrl' => $mediaUrl !== '' ? $mediaUrl : null,
        'options' => $normalizedOptions,
        'correctAnswer' => $answerKey['correctAnswer'] ?? null,
        'items' => $content['items'] ?? [],
        'labels' => $content['labels'] ?? [],
        'matchingPairs' => $content['pairs'] ?? [],
        'content' => $content,
        'answerKey' => $answerKey,
        'timer' => $timer,
        'showLeaderboardAfter' => $showLeaderboardAfter,
    ];
}

try {
    $normalizedQuestions = [];
    foreach ($questions as $index => $question) {
        if (!is_array($question)) {
            throw new InvalidArgumentException('Question payload at position ' . ($index + 1) . ' is invalid');
        }
        $normalizedQuestions[] = normalizeQuestion($question, $index);
    }

    $pdo->beginTransaction();

    $publicCode = generatePublicCode($pdo);
    $insertSession = $pdo->prepare(
        'INSERT INTO quiz_sessions (
            admin_id,
            public_code,
            title,
            description,
            youtube_url,
            thumbnail_url,
            intro_video_url,
            status,
            participant_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)'
    );
    $insertSession->execute([
        (int) $_SESSION['admin_id'],
        $publicCode,
        $title,
        $description !== '' ? $description : null,
        $youtubeUrl !== '' ? $youtubeUrl : null,
        $thumbnailUrl !== '' ? $thumbnailUrl : null,
        $introVideoUrl !== '' ? $introVideoUrl : null,
        $status,
    ]);

    $sessionId = (int) $pdo->lastInsertId();
    $firstQuestionId = null;

    $insertQuestion = $pdo->prepare(
        'INSERT INTO session_questions (
            session_id,
            display_order,
            question_type,
            question_text,
            instructions,
            media_url,
            content_json,
            answer_key_json,
            time_limit_seconds,
            show_leaderboard_after
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $insertOption = $pdo->prepare(
        'INSERT INTO question_options (
            question_id,
            display_order,
            option_text,
            is_correct
        ) VALUES (?, ?, ?, ?)'
    );

    $responseQuestions = [];

    foreach ($normalizedQuestions as $questionIndex => $question) {
        $insertQuestion->execute([
            $sessionId,
            $questionIndex + 1,
            $question['questionType'],
            $question['text'],
            $question['instructions'],
            $question['mediaUrl'],
            json_encode($question['content'], JSON_UNESCAPED_UNICODE),
            json_encode($question['answerKey'], JSON_UNESCAPED_UNICODE),
            $question['timer'],
            $question['showLeaderboardAfter'] ? 1 : 0,
        ]);

        $questionId = (int) $pdo->lastInsertId();
        if ($firstQuestionId === null) {
            $firstQuestionId = $questionId;
        }

        $responseOptions = [];
        if ($question['questionType'] === 'multiple_choice') {
            foreach ($question['options'] as $optionIndex => $optionText) {
                $insertOption->execute([
                    $questionId,
                    $optionIndex + 1,
                    $optionText,
                    $optionIndex === $question['correctAnswer'] ? 1 : 0,
                ]);

                $responseOptions[] = [
                    'id' => (int) $pdo->lastInsertId(),
                    'text' => $optionText,
                    'displayOrder' => $optionIndex + 1,
                    'isCorrect' => $optionIndex === $question['correctAnswer'],
                ];
            }
        }

        $responseQuestions[] = [
            'id' => $questionId,
            'questionType' => $question['questionType'],
            'text' => $question['text'],
            'instructions' => $question['instructions'],
            'mediaUrl' => $question['mediaUrl'],
            'options' => $question['options'],
            'correctAnswer' => $question['correctAnswer'],
            'items' => $question['items'],
            'correctOrder' => $question['questionType'] === 'sorting' ? $question['answerKey']['correctOrder'] : [],
            'labels' => $question['labels'],
            'matchingPairs' => $question['matchingPairs'],
            'timer' => $question['timer'],
            'showLeaderboardAfter' => $question['showLeaderboardAfter'],
            'optionRecords' => $responseOptions,
        ];
    }

    $updateCurrentQuestion = $pdo->prepare(
        'UPDATE quiz_sessions SET current_question_id = ? WHERE id = ?'
    );
    $updateCurrentQuestion->execute([$firstQuestionId, $sessionId]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => $status === 'draft' ? 'Session draft saved successfully' : 'Session created successfully',
        'session' => [
            'id' => $sessionId,
            'code' => $publicCode,
            'title' => $title,
            'description' => $description,
            'videoUrl' => $youtubeUrl,
            'thumbnailUrl' => $thumbnailUrl,
            'introVideoUrl' => $introVideoUrl,
            'questions' => $responseQuestions,
            'status' => $status,
            'currentQuestionIndex' => -1,
            'participants' => 0,
        ],
    ]);
} catch (InvalidArgumentException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to create session']);
}
