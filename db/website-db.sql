-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 27, 2026 at 12:30 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `website-db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `name`, `username`, `password`, `created_at`, `updated_at`) VALUES
(1, 'Kishore', 'mailingkishore72@gmail.com', '123', '2026-05-12 22:24:00', '2026-05-12 22:24:00');

-- --------------------------------------------------------

--
-- Table structure for table `participant_answers`
--

CREATE TABLE `participant_answers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `session_id` bigint(20) UNSIGNED NOT NULL,
  `question_id` bigint(20) UNSIGNED NOT NULL,
  `participant_id` bigint(20) UNSIGNED NOT NULL,
  `selected_option_id` bigint(20) UNSIGNED DEFAULT NULL,
  `response_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`response_json`)),
  `is_correct` tinyint(1) NOT NULL,
  `response_time_ms` int(10) UNSIGNED DEFAULT NULL,
  `score_awarded` int(11) NOT NULL DEFAULT 0,
  `max_score` int(11) NOT NULL DEFAULT 1000,
  `answered_at` datetime(6) NOT NULL DEFAULT current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `participant_answers`
--

INSERT INTO `participant_answers` (`id`, `session_id`, `question_id`, `participant_id`, `selected_option_id`, `response_json`, `is_correct`, `response_time_ms`, `score_awarded`, `max_score`, `answered_at`) VALUES
(208, 103, 228, 126, 433, NULL, 1, 4978, 934, 1000, '2026-05-27 03:17:57.177895'),
(209, 103, 229, 126, NULL, '{\"items\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', 1, 19388, 741, 1000, '2026-05-27 03:18:24.171042'),
(210, 103, 230, 126, NULL, '{\"labels\":{\"brain\":\"brain\",\"lungs\":\"lungs\",\"stomach\":\"stomach\"}}', 1, 19503, 805, 1000, '2026-05-27 03:18:55.132050'),
(211, 104, 231, 127, 437, NULL, 1, 4624, 969, 1000, '2026-05-27 03:38:38.441767'),
(212, 104, 231, 128, 437, NULL, 1, 8292, 945, 1000, '2026-05-27 03:38:42.109960'),
(213, 104, 231, 129, 437, NULL, 1, 11805, 921, 1000, '2026-05-27 03:38:45.623444'),
(214, 104, 231, 130, 437, NULL, 1, 14934, 900, 1000, '2026-05-27 03:38:48.752014'),
(215, 104, 232, 127, NULL, '{\"items\":[\"A\",\"B\",\"C\",\"D\"]}', 1, 8969, 940, 1000, '2026-05-27 03:40:59.162103'),
(216, 104, 232, 128, NULL, '{\"items\":[\"A\",\"B\",\"D\",\"C\"]}', 0, 17763, 0, 1000, '2026-05-27 03:41:07.955570'),
(217, 104, 232, 130, NULL, '{\"items\":[\"A\",\"B\",\"C\",\"D\"]}', 1, 26839, 821, 1000, '2026-05-27 03:41:17.032134'),
(218, 104, 233, 127, NULL, '{\"labels\":{\"brain\":\"brain\",\"lungs\":\"lungs\",\"stomach\":\"stomach\"}}', 1, 21158, 894, 1000, '2026-05-27 03:42:20.271851'),
(219, 104, 233, 128, NULL, '{\"labels\":{\"brain\":\"brain\",\"lungs\":\"stomach\",\"stomach\":\"lungs\"}}', 0, 38272, 342, 1000, '2026-05-27 03:42:37.385800'),
(220, 104, 233, 129, NULL, '{\"labels\":{\"brain\":\"brain\",\"lungs\":\"lungs\",\"stomach\":\"stomac\"}}', 0, 56917, 482, 1000, '2026-05-27 03:42:56.030448'),
(221, 104, 234, 130, NULL, '{\"matches\":{\"match_1779852835723_1\":\"match_1779852835723_1\",\"match_1779852835723_2\":\"match_1779852835723_2\",\"match_1779852835723_3\":\"match_1779852835723_3\"}}', 1, 18777, 906, 1000, '2026-05-27 03:51:14.550630'),
(222, 104, 234, 127, NULL, NULL, 0, 60000, 0, 1000, '2026-05-27 03:51:56.358021'),
(223, 104, 234, 128, NULL, NULL, 0, 60000, 0, 1000, '2026-05-27 03:51:56.364493'),
(224, 104, 234, 129, NULL, NULL, 0, 60000, 0, 1000, '2026-05-27 03:51:56.365013'),
(225, 105, 237, 131, NULL, NULL, 0, 30000, 0, 1000, '2026-05-27 04:04:32.234663'),
(226, 107, 241, 132, 449, NULL, 1, 7731, 897, 1000, '2026-05-27 06:33:12.947737'),
(227, 107, 243, 132, NULL, NULL, 0, 30000, 0, 1000, '2026-05-27 06:34:30.784074'),
(228, 109, 247, 134, 457, NULL, 1, 6937, 908, 1000, '2026-05-27 06:57:07.379528'),
(229, 109, 249, 134, NULL, NULL, 0, 30000, 0, 1000, '2026-05-27 06:58:14.922053'),
(230, 111, 253, 135, 465, NULL, 1, 5525, 963, 1000, '2026-05-27 07:06:04.123865'),
(231, 111, 253, 136, 465, NULL, 1, 9163, 939, 1000, '2026-05-27 07:06:07.761550'),
(232, 111, 253, 137, 465, NULL, 1, 12295, 918, 1000, '2026-05-27 07:06:10.893758'),
(233, 111, 253, 138, 465, NULL, 1, 15258, 898, 1000, '2026-05-27 07:06:13.856097'),
(234, 111, 254, 135, NULL, '{\"items\":[\"A\",\"B\",\"C\",\"D\"]}', 1, 6795, 955, 1000, '2026-05-27 07:11:30.704396'),
(235, 111, 254, 136, NULL, '{\"items\":[\"A\",\"C\",\"B\",\"D\"]}', 0, 10769, 0, 1000, '2026-05-27 07:11:34.678225'),
(236, 111, 254, 138, NULL, '{\"items\":[\"A\",\"B\",\"C\",\"D\"]}', 1, 27950, 814, 1000, '2026-05-27 07:11:51.859384'),
(237, 111, 254, 137, NULL, NULL, 0, 60000, 0, 1000, '2026-05-27 07:12:28.889051'),
(238, 111, 255, 137, NULL, '{\"labels\":{\"brain\":\"brain\",\"lungs\":\"lungs\",\"stomach\":\"stomach\"}}', 1, 17828, 911, 1000, '2026-05-27 07:13:51.634511'),
(239, 111, 255, 135, NULL, '{\"labels\":{\"brain\":\"brain\",\"lungs\":\"lungs\",\"stomach\":\"stomach\"}}', 1, 33865, 831, 1000, '2026-05-27 07:14:07.669190'),
(240, 111, 255, 136, NULL, '{\"labels\":{\"brain\":\"brain\",\"lungs\":\"lungs\",\"stomach\":\"stomach\"}}', 1, 46462, 768, 1000, '2026-05-27 07:14:20.266088'),
(241, 111, 256, 135, NULL, '{\"matches\":{\"match_1779865397015_1\":\"match_1779865397015_2\",\"match_1779865397015_2\":\"match_1779865397015_3\",\"match_1779865397015_3\":\"match_1779865397015_1\"}}', 0, 12656, 0, 1000, '2026-05-27 07:15:12.439795'),
(242, 111, 256, 136, NULL, '{\"matches\":{\"match_1779865397015_1\":\"match_1779865397015_1\",\"match_1779865397015_2\":\"match_1779865397015_2\",\"match_1779865397015_3\":\"match_1779865397015_3\"}}', 1, 23632, 882, 1000, '2026-05-27 07:15:23.415655'),
(243, 111, 256, 137, NULL, '{\"matches\":{\"match_1779865397015_1\":\"match_1779865397015_1\",\"match_1779865397015_2\":\"match_1779865397015_2\",\"match_1779865397015_3\":\"match_1779865397015_3\"}}', 1, 35320, 823, 1000, '2026-05-27 07:15:35.104025'),
(244, 111, 256, 138, NULL, NULL, 0, 60000, 0, 1000, '2026-05-27 07:15:59.880462'),
(245, 112, 257, 139, NULL, NULL, 0, 30000, 0, 1000, '2026-05-27 08:27:04.928331');

-- --------------------------------------------------------

--
-- Table structure for table `participant_question_option_orders`
--

CREATE TABLE `participant_question_option_orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `participant_id` bigint(20) UNSIGNED NOT NULL,
  `question_id` bigint(20) UNSIGNED NOT NULL,
  `option_order_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`option_order_json`)),
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `participant_question_option_orders`
--

INSERT INTO `participant_question_option_orders` (`id`, `participant_id`, `question_id`, `option_order_json`, `created_at`) VALUES
(38, 126, 228, '[436,434,433,435]', '2026-05-27 03:17:52.313789'),
(39, 127, 231, '[439,440,437,438]', '2026-05-27 03:38:33.945158'),
(40, 128, 231, '[438,439,440,437]', '2026-05-27 03:38:33.959657'),
(41, 130, 231, '[440,438,437,439]', '2026-05-27 03:38:33.965315'),
(42, 129, 231, '[440,439,438,437]', '2026-05-27 03:38:33.968080'),
(43, 131, 235, '[444,442,441,443]', '2026-05-27 04:03:54.721244'),
(44, 132, 241, '[450,452,449,451]', '2026-05-27 06:33:09.879708'),
(45, 133, 244, '[454,455,453,456]', '2026-05-27 06:42:15.657875'),
(46, 134, 247, '[460,459,457,458]', '2026-05-27 06:57:00.569629'),
(47, 137, 253, '[467,465,468,466]', '2026-05-27 07:05:58.643135'),
(48, 138, 253, '[466,468,465,467]', '2026-05-27 07:05:58.653052'),
(49, 135, 253, '[467,465,466,468]', '2026-05-27 07:05:58.653113'),
(50, 136, 253, '[465,468,467,466]', '2026-05-27 07:05:58.660984'),
(51, 139, 257, '[471,469,472,470]', '2026-05-27 08:26:34.858233');

-- --------------------------------------------------------

--
-- Table structure for table `question_options`
--

CREATE TABLE `question_options` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `question_id` bigint(20) UNSIGNED NOT NULL,
  `display_order` tinyint(3) UNSIGNED NOT NULL,
  `option_text` varchar(500) NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `question_options`
--

INSERT INTO `question_options` (`id`, `question_id`, `display_order`, `option_text`, `is_correct`) VALUES
(433, 228, 1, 'Vitamin D', 1),
(434, 228, 2, 'Vitamin C', 0),
(435, 228, 3, 'Vitamin K', 0),
(436, 228, 4, 'Vitamin B12', 0),
(437, 231, 1, 'Vitamin D', 1),
(438, 231, 2, 'Vitamin C', 0),
(439, 231, 3, 'Vitamin K', 0),
(440, 231, 4, 'Vitamin B12', 0),
(441, 235, 1, 'Vitamin D', 1),
(442, 235, 2, 'Vitamin C', 0),
(443, 235, 3, 'Vitamin K', 0),
(444, 235, 4, 'Vitamin B12', 0),
(445, 238, 1, 'Vitamin D', 1),
(446, 238, 2, 'Vitamin C', 0),
(447, 238, 3, 'Vitamin K', 0),
(448, 238, 4, 'Vitamin B12', 0),
(449, 241, 1, 'Vitamin D', 1),
(450, 241, 2, 'Vitamin C', 0),
(451, 241, 3, 'Vitamin K', 0),
(452, 241, 4, 'Vitamin B12', 0),
(453, 244, 1, 'Vitamin D', 1),
(454, 244, 2, 'Vitamin C', 0),
(455, 244, 3, 'Vitamin K', 0),
(456, 244, 4, 'Vitamin B12', 0),
(457, 247, 1, 'Vitamin D', 1),
(458, 247, 2, 'Vitamin C', 0),
(459, 247, 3, 'Vitamin K', 0),
(460, 247, 4, 'Vitamin B12', 0),
(461, 250, 1, 'Vitamin D', 1),
(462, 250, 2, 'Vitamin C', 0),
(463, 250, 3, 'Vitamin K', 0),
(464, 250, 4, 'Vitamin B12', 0),
(465, 253, 1, 'Vitamin D', 1),
(466, 253, 2, 'Vitamin C', 0),
(467, 253, 3, 'Vitamin K', 0),
(468, 253, 4, 'Vitamin B12', 0),
(469, 257, 1, 'Vitamin D', 1),
(470, 257, 2, 'Vitamin C', 0),
(471, 257, 3, 'Vitamin K', 0),
(472, 257, 4, 'Vitamin B12', 0);

-- --------------------------------------------------------

--
-- Table structure for table `quiz_sessions`
--

CREATE TABLE `quiz_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `public_code` char(6) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `youtube_url` varchar(500) DEFAULT NULL,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `intro_video_url` varchar(500) DEFAULT NULL,
  `status` enum('draft','scheduled','waiting','active','paused','leaderboard','results','ended','archived') NOT NULL DEFAULT 'draft',
  `current_question_id` bigint(20) UNSIGNED DEFAULT NULL,
  `question_started_at` datetime(6) DEFAULT NULL,
  `participant_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `host_connection_status` enum('connected','reconnecting','disconnected') NOT NULL DEFAULT 'connected',
  `host_last_seen_at` datetime(6) DEFAULT NULL,
  `paused_at` datetime(6) DEFAULT NULL,
  `pause_reason` varchar(255) DEFAULT NULL,
  `accumulated_pause_ms` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quiz_sessions`
--

INSERT INTO `quiz_sessions` (`id`, `admin_id`, `public_code`, `title`, `description`, `youtube_url`, `thumbnail_url`, `intro_video_url`, `status`, `current_question_id`, `question_started_at`, `participant_count`, `created_at`, `updated_at`, `host_connection_status`, `host_last_seen_at`, `paused_at`, `pause_reason`, `accumulated_pause_ms`) VALUES
(103, 1, 'FAC607', 'Health Foundations Quiz', 'A mixed-format health quiz with multiple choice, ordering, and image labeling for anatomy and clinical basics.', NULL, NULL, NULL, 'ended', 230, NULL, 1, '2026-05-27 03:17:24', '2026-05-27 03:32:10', 'reconnecting', '2026-05-27 03:32:10.888541', NULL, NULL, 0),
(104, 1, '27D74E', 'Health Foundations Quiz', 'A mixed-format health quiz with multiple choice, ordering, and image labeling for anatomy and clinical basics.', NULL, NULL, NULL, 'ended', 234, NULL, 4, '2026-05-27 03:35:14', '2026-05-27 04:03:30', 'reconnecting', '2026-05-27 04:03:30.796854', NULL, NULL, 0),
(105, 1, '4D0AEF', 'Health Foundations Quiz', 'A mixed-format health quiz with multiple choice, ordering, and image labeling for anatomy and clinical basics.', NULL, NULL, NULL, 'ended', 237, NULL, 1, '2026-05-27 04:03:36', '2026-05-27 04:17:22', 'connected', '2026-05-27 04:17:22.369175', NULL, NULL, 0),
(106, 1, '76E31D', 'Health Foundations Quiz', 'A mixed-format health quiz with multiple choice, ordering, and image labeling for anatomy and clinical basics.', NULL, NULL, NULL, 'waiting', 238, NULL, 0, '2026-05-27 06:32:46', '2026-05-27 06:32:46', 'connected', NULL, NULL, NULL, 0),
(107, 1, '8491DE', 'Health Foundations Quiz', 'A mixed-format health quiz with multiple choice, ordering, and image labeling for anatomy and clinical basics.', NULL, NULL, NULL, 'ended', 243, NULL, 1, '2026-05-27 06:32:54', '2026-05-27 06:40:34', 'connected', '2026-05-27 06:40:34.581609', NULL, NULL, 0),
(108, 1, 'AD6AC9', 'Health Foundations Quiz', 'A mixed-format health quiz with multiple choice, ordering, and image labeling for anatomy and clinical basics.', NULL, NULL, NULL, 'paused', 244, '2026-05-27 06:42:15.551445', 1, '2026-05-27 06:40:36', '2026-05-27 06:55:32', 'reconnecting', '2026-05-27 06:55:32.142203', NULL, NULL, 0),
(109, 1, 'F77201', 'Health Foundations Quiz', 'A mixed-format health quiz with multiple choice, ordering, and image labeling for anatomy and clinical basics.', NULL, NULL, NULL, 'ended', 249, NULL, 1, '2026-05-27 06:56:35', '2026-05-27 07:02:29', 'reconnecting', '2026-05-27 07:02:29.603878', NULL, NULL, 0),
(110, 1, 'E31724', 'Health Foundations Quiz', 'A mixed-format health quiz with multiple choice, ordering, and image labeling for anatomy and clinical basics.', NULL, NULL, NULL, 'draft', 250, NULL, 0, '2026-05-27 07:02:39', '2026-05-27 07:02:48', 'reconnecting', '2026-05-27 07:02:48.114551', NULL, NULL, 0),
(111, 1, '22E990', 'Health Foundations Quiz', 'A mixed-format health quiz with multiple choice, ordering, and image labeling for anatomy and clinical basics.', NULL, NULL, NULL, 'ended', 256, NULL, 4, '2026-05-27 07:04:19', '2026-05-27 07:16:35', 'connected', '2026-05-27 07:05:52.853852', NULL, NULL, 0),
(112, 1, 'AD8A91', 'Health Foundations Quiz', 'A mixed-format health quiz with multiple choice, ordering, and image labeling for anatomy and clinical basics.', NULL, NULL, NULL, 'ended', 259, NULL, 1, '2026-05-27 08:25:55', '2026-05-27 08:44:57', 'connected', '2026-05-27 08:44:57.262390', NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `session_events`
--

CREATE TABLE `session_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `session_id` bigint(20) UNSIGNED NOT NULL,
  `participant_id` bigint(20) UNSIGNED DEFAULT NULL,
  `event_type` varchar(50) NOT NULL,
  `event_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`event_payload`)),
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `session_participants`
--

CREATE TABLE `session_participants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `session_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `join_token` char(36) NOT NULL,
  `status` enum('joined','active','disconnected','finished') NOT NULL DEFAULT 'joined',
  `total_score` int(11) NOT NULL DEFAULT 0,
  `joined_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `last_seen_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `disconnected_at` datetime(6) DEFAULT NULL,
  `active_socket_id` varchar(100) DEFAULT NULL,
  `active_socket_connected_at` datetime(6) DEFAULT NULL,
  `connection_status` enum('connected','reconnecting','disconnected') NOT NULL DEFAULT 'connected',
  `last_socket_error` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `session_participants`
--

INSERT INTO `session_participants` (`id`, `session_id`, `student_id`, `join_token`, `status`, `total_score`, `joined_at`, `last_seen_at`, `disconnected_at`, `active_socket_id`, `active_socket_connected_at`, `connection_status`, `last_socket_error`) VALUES
(126, 103, 30, 'fa7cf980-cd89-f25e-b0fe-392168072e1e', 'active', 2480, '2026-05-27 03:17:33.255709', '2026-05-27 03:30:41.588330', '2026-05-27 03:30:41.588330', 'MTxNTiaPazC_m3L7AAAH', '2026-05-27 03:27:20.321262', 'disconnected', 'Reconnect grace period expired'),
(127, 104, 30, 'cc5381d6-7891-b2ac-dbf3-0c5413d89bb7', 'active', 2803, '2026-05-27 03:37:33.188498', '2026-05-27 04:04:10.544453', '2026-05-27 04:04:10.544453', 'Y3djWfxuu5ivZwT7AAAj', '2026-05-27 04:02:02.374845', 'disconnected', 'Reconnect grace period expired'),
(128, 104, 31, 'f34d0400-f736-97fd-a3bb-e4937222f153', 'active', 1287, '2026-05-27 03:37:48.080719', '2026-05-27 04:04:07.216374', '2026-05-27 04:04:07.216374', '1v9-gnfc0IdK-YmuAAAl', '2026-05-27 04:02:02.378804', 'disconnected', 'Reconnect grace period expired'),
(129, 104, 32, '3fe502ed-3aec-b276-4cd8-df3a46a20065', 'active', 1403, '2026-05-27 03:38:09.433143', '2026-05-27 04:04:07.789862', '2026-05-27 04:04:07.789862', 'l1OC09nwhpnF5FXwAAAh', '2026-05-27 04:02:02.352282', 'disconnected', 'Reconnect grace period expired'),
(130, 104, 33, '311fbac6-f7d3-9f99-1b41-f47044ba25a9', 'active', 2627, '2026-05-27 03:38:21.240080', '2026-05-27 04:04:08.459873', '2026-05-27 04:04:08.459873', 'Lm1VrSBR9BEO1zk5AAAf', '2026-05-27 04:02:02.338652', 'disconnected', 'Reconnect grace period expired'),
(131, 105, 30, '49e76594-d1f8-c9ac-1e19-6626f01702e3', 'active', 0, '2026-05-27 04:03:49.145305', '2026-05-27 04:23:46.357489', '2026-05-27 04:23:46.357489', 'HotMn8-6gAC9_cFfAAAw', '2026-05-27 04:17:22.335401', 'disconnected', 'Reconnect grace period expired'),
(132, 107, 30, '812869dc-ca0e-cb66-5d74-499a1e986f25', 'active', 897, '2026-05-27 06:33:09.859088', '2026-05-27 06:41:17.026777', '2026-05-27 06:41:17.026777', 'w5jtK5mUbdFXwzh0AAAB', '2026-05-27 06:40:14.541460', 'disconnected', 'Reconnect grace period expired'),
(133, 108, 30, '04920b84-5da9-9f42-24dd-cbaaf5abe3d4', 'active', 0, '2026-05-27 06:40:56.009067', '2026-05-27 06:55:33.208083', '2026-05-27 06:55:33.208083', 'Gt6zK6X95lAbazNmAHyT', '2026-05-27 06:53:13.628128', 'reconnecting', NULL),
(134, 109, 30, 'ead6f545-9bfb-0d06-e21a-4ee8704c9a9c', 'active', 908, '2026-05-27 06:56:47.484539', '2026-05-27 07:04:53.380647', '2026-05-27 07:04:53.380647', 'tOxJp58Zd-BZlyIDAAAJ', '2026-05-27 07:01:15.839523', 'disconnected', 'Reconnect grace period expired'),
(135, 111, 30, '9e0dc55c-5761-c3b3-8494-7e92409af043', 'active', 2749, '2026-05-27 07:04:51.561033', '2026-05-27 08:26:42.389478', '2026-05-27 08:26:42.389478', 'fXrIgEz_TSBgzorYAABD', '2026-05-27 08:25:30.969365', 'disconnected', 'Reconnect grace period expired'),
(136, 111, 34, '262484fc-ea90-177b-f1d2-9040916e8fca', 'active', 2589, '2026-05-27 07:05:08.421227', '2026-05-27 08:44:54.779519', '2026-05-27 08:44:54.779519', 'XzOT0TQcaW7gzUPfAABr', '2026-05-27 08:41:18.922546', 'reconnecting', NULL),
(137, 111, 35, '5f92c972-366f-8882-286e-0377392c2a59', 'active', 2652, '2026-05-27 07:05:30.067430', '2026-05-27 08:44:54.768171', '2026-05-27 08:44:54.768171', 'W9c9o1upGgSoRNECAABt', '2026-05-27 08:41:18.927608', 'reconnecting', NULL),
(138, 111, 36, '12d043c3-f0b3-d064-51cf-bd1bb7d31305', 'active', 1712, '2026-05-27 07:05:45.785671', '2026-05-27 08:44:54.760285', '2026-05-27 08:44:54.760285', 'teYTuqn38JuYq3svAABq', '2026-05-27 08:41:18.915287', 'reconnecting', NULL),
(139, 112, 30, '4f77f737-8bcf-bb36-07ef-a8268050c36e', 'active', 0, '2026-05-27 08:26:23.668147', '2026-05-27 08:44:54.757106', '2026-05-27 08:44:54.757106', 'xv15cFmc5j44FUb4AAB5', '2026-05-27 08:43:50.770949', 'reconnecting', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `session_questions`
--

CREATE TABLE `session_questions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `session_id` bigint(20) UNSIGNED NOT NULL,
  `display_order` int(10) UNSIGNED NOT NULL,
  `question_type` enum('multiple_choice','sorting','drag_drop','find_on_image','label_image','matching','fill_in_blanks') NOT NULL DEFAULT 'multiple_choice',
  `question_text` text NOT NULL,
  `instructions` text DEFAULT NULL,
  `media_url` varchar(500) DEFAULT NULL,
  `content_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`content_json`)),
  `answer_key_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`answer_key_json`)),
  `scoring_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`scoring_json`)),
  `time_limit_seconds` smallint(5) UNSIGNED NOT NULL,
  `show_leaderboard_after` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `session_questions`
--

INSERT INTO `session_questions` (`id`, `session_id`, `display_order`, `question_type`, `question_text`, `instructions`, `media_url`, `content_json`, `answer_key_json`, `scoring_json`, `time_limit_seconds`, `show_leaderboard_after`, `created_at`) VALUES
(228, 103, 1, 'multiple_choice', 'Which vitamin is produced when skin is exposed to sunlight?', NULL, NULL, '{\"options\":[\"Vitamin D\",\"Vitamin C\",\"Vitamin K\",\"Vitamin B12\"]}', '{\"correctAnswer\":0}', NULL, 30, 1, '2026-05-27 03:17:24'),
(229, 103, 2, 'sorting', 'Arrange the proper handwashing steps in the correct order.', NULL, NULL, '{\"items\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', '{\"correctOrder\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', NULL, 30, 1, '2026-05-27 03:17:24'),
(230, 103, 3, 'label_image', 'Label the key organs shown in this digestive system diagram.', 'Type the organ name for each numbered marker.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', NULL, 30, 1, '2026-05-27 03:17:24'),
(231, 104, 1, 'multiple_choice', 'Which vitamin is produced when skin is exposed to sunlight?', NULL, NULL, '{\"options\":[\"Vitamin D\",\"Vitamin C\",\"Vitamin K\",\"Vitamin B12\"]}', '{\"correctAnswer\":0}', NULL, 60, 1, '2026-05-27 03:35:14'),
(232, 104, 2, 'sorting', 'Arrange the proper handwashing steps in the correct order.', NULL, NULL, '{\"items\":[\"A\",\"B\",\"C\",\"D\"]}', '{\"correctOrder\":[\"A\",\"B\",\"C\",\"D\"]}', NULL, 60, 1, '2026-05-27 03:35:14'),
(233, 104, 3, 'label_image', 'Label the key organs shown in this digestive system diagram.', 'Type the organ name for each numbered marker.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', NULL, 60, 1, '2026-05-27 03:35:14'),
(234, 104, 4, 'matching', 'MATCH THE FOLLOWING CORRECTLY :-', 'Match each item on the left with the correct item on the right.', NULL, '{\"pairs\":[{\"id\":\"match_1779852835723_1\",\"leftText\":\"A\",\"leftImageUrl\":null,\"rightText\":\"OPT 01\",\"rightImageUrl\":null},{\"id\":\"match_1779852835723_2\",\"leftText\":\"\",\"leftImageUrl\":\"http:\\/\\/localhost\\/WEBSITE-backend\\/uploads\\/label-images\\/WhatsApp-Image-2026-05-26-at-2-19-11-PM-20260527-033424-e6cb9d86.jpg\",\"rightText\":\"LANGUAGE LEARNING APP\",\"rightImageUrl\":null},{\"id\":\"match_1779852835723_3\",\"leftText\":\"C\",\"leftImageUrl\":null,\"rightText\":\"OPT 0C\",\"rightImageUrl\":null}]}', '{\"pairs\":[{\"id\":\"match_1779852835723_1\",\"leftText\":\"A\",\"leftImageUrl\":null,\"rightText\":\"OPT 01\",\"rightImageUrl\":null},{\"id\":\"match_1779852835723_2\",\"leftText\":\"\",\"leftImageUrl\":\"http:\\/\\/localhost\\/WEBSITE-backend\\/uploads\\/label-images\\/WhatsApp-Image-2026-05-26-at-2-19-11-PM-20260527-033424-e6cb9d86.jpg\",\"rightText\":\"LANGUAGE LEARNING APP\",\"rightImageUrl\":null},{\"id\":\"match_1779852835723_3\",\"leftText\":\"C\",\"leftImageUrl\":null,\"rightText\":\"OPT 0C\",\"rightImageUrl\":null}]}', NULL, 60, 1, '2026-05-27 03:35:14'),
(235, 105, 1, 'multiple_choice', 'Which vitamin is produced when skin is exposed to sunlight?', NULL, NULL, '{\"options\":[\"Vitamin D\",\"Vitamin C\",\"Vitamin K\",\"Vitamin B12\"]}', '{\"correctAnswer\":0}', NULL, 30, 1, '2026-05-27 04:03:36'),
(236, 105, 2, 'sorting', 'Arrange the proper handwashing steps in the correct order.', NULL, NULL, '{\"items\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', '{\"correctOrder\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', NULL, 30, 1, '2026-05-27 04:03:36'),
(237, 105, 3, 'label_image', 'Label the key organs shown in this digestive system diagram.', 'Type the organ name for each numbered marker.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', NULL, 30, 1, '2026-05-27 04:03:36'),
(238, 106, 1, 'multiple_choice', 'Which vitamin is produced when skin is exposed to sunlight?', NULL, NULL, '{\"options\":[\"Vitamin D\",\"Vitamin C\",\"Vitamin K\",\"Vitamin B12\"]}', '{\"correctAnswer\":0}', NULL, 30, 1, '2026-05-27 06:32:46'),
(239, 106, 2, 'sorting', 'Arrange the proper handwashing steps in the correct order.', NULL, NULL, '{\"items\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', '{\"correctOrder\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', NULL, 30, 1, '2026-05-27 06:32:46'),
(240, 106, 3, 'label_image', 'Label the key organs shown in this digestive system diagram.', 'Type the organ name for each numbered marker.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', NULL, 30, 1, '2026-05-27 06:32:46'),
(241, 107, 1, 'multiple_choice', 'Which vitamin is produced when skin is exposed to sunlight?', NULL, NULL, '{\"options\":[\"Vitamin D\",\"Vitamin C\",\"Vitamin K\",\"Vitamin B12\"]}', '{\"correctAnswer\":0}', NULL, 30, 1, '2026-05-27 06:32:54'),
(242, 107, 2, 'sorting', 'Arrange the proper handwashing steps in the correct order.', NULL, NULL, '{\"items\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', '{\"correctOrder\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', NULL, 30, 1, '2026-05-27 06:32:54'),
(243, 107, 3, 'label_image', 'Label the key organs shown in this digestive system diagram.', 'Type the organ name for each numbered marker.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', NULL, 30, 1, '2026-05-27 06:32:54'),
(244, 108, 1, 'multiple_choice', 'Which vitamin is produced when skin is exposed to sunlight?', NULL, NULL, '{\"options\":[\"Vitamin D\",\"Vitamin C\",\"Vitamin K\",\"Vitamin B12\"]}', '{\"correctAnswer\":0}', NULL, 30, 1, '2026-05-27 06:40:36'),
(245, 108, 2, 'sorting', 'Arrange the proper handwashing steps in the correct order.', NULL, NULL, '{\"items\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', '{\"correctOrder\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', NULL, 30, 1, '2026-05-27 06:40:36'),
(246, 108, 3, 'label_image', 'Label the key organs shown in this digestive system diagram.', 'Type the organ name for each numbered marker.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', NULL, 30, 1, '2026-05-27 06:40:36'),
(247, 109, 1, 'multiple_choice', 'Which vitamin is produced when skin is exposed to sunlight?', NULL, NULL, '{\"options\":[\"Vitamin D\",\"Vitamin C\",\"Vitamin K\",\"Vitamin B12\"]}', '{\"correctAnswer\":0}', NULL, 30, 1, '2026-05-27 06:56:35'),
(248, 109, 2, 'sorting', 'Arrange the proper handwashing steps in the correct order.', NULL, NULL, '{\"items\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', '{\"correctOrder\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', NULL, 30, 1, '2026-05-27 06:56:35'),
(249, 109, 3, 'label_image', 'Label the key organs shown in this digestive system diagram.', 'Type the organ name for each numbered marker.', 'http://103.249.82.251:8080/WEBSITE-backend/uploads/label-images/gettyimages-182043494-612x612-20260527-065629-ad745ed0.jpg', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', NULL, 30, 1, '2026-05-27 06:56:35'),
(250, 110, 1, 'multiple_choice', 'Which vitamin is produced when skin is exposed to sunlight?', NULL, NULL, '{\"options\":[\"Vitamin D\",\"Vitamin C\",\"Vitamin K\",\"Vitamin B12\"]}', '{\"correctAnswer\":0}', NULL, 30, 1, '2026-05-27 07:02:39'),
(251, 110, 2, 'sorting', 'Arrange the proper handwashing steps in the correct order.', NULL, NULL, '{\"items\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', '{\"correctOrder\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', NULL, 30, 1, '2026-05-27 07:02:39'),
(252, 110, 3, 'label_image', 'Label the key organs shown in this digestive system diagram.', 'Type the organ name for each numbered marker.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', NULL, 30, 1, '2026-05-27 07:02:39'),
(253, 111, 1, 'multiple_choice', 'Which vitamin is produced when skin is exposed to sunlight?', NULL, NULL, '{\"options\":[\"Vitamin D\",\"Vitamin C\",\"Vitamin K\",\"Vitamin B12\"]}', '{\"correctAnswer\":0}', NULL, 60, 1, '2026-05-27 07:04:19'),
(254, 111, 2, 'sorting', 'Arrange the proper handwashing steps in the correct order.', NULL, NULL, '{\"items\":[\"A\",\"B\",\"C\",\"D\"]}', '{\"correctOrder\":[\"A\",\"B\",\"C\",\"D\"]}', NULL, 60, 1, '2026-05-27 07:04:19'),
(255, 111, 3, 'label_image', 'Label the key organs shown in this digestive system diagram.', 'Type the organ name for each numbered marker.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', NULL, 60, 1, '2026-05-27 07:04:19'),
(256, 111, 4, 'matching', 'match the following question correctly?', 'Match each item on the left with the correct item on the right.', NULL, '{\"pairs\":[{\"id\":\"match_1779865397015_1\",\"leftText\":\"A\",\"leftImageUrl\":null,\"rightText\":\"OPT 01\",\"rightImageUrl\":null},{\"id\":\"match_1779865397015_2\",\"leftText\":\"B\",\"leftImageUrl\":null,\"rightText\":\"OPT 02\",\"rightImageUrl\":null},{\"id\":\"match_1779865397015_3\",\"leftText\":\"C\",\"leftImageUrl\":null,\"rightText\":\"OPT 03\",\"rightImageUrl\":null}]}', '{\"pairs\":[{\"id\":\"match_1779865397015_1\",\"leftText\":\"A\",\"leftImageUrl\":null,\"rightText\":\"OPT 01\",\"rightImageUrl\":null},{\"id\":\"match_1779865397015_2\",\"leftText\":\"B\",\"leftImageUrl\":null,\"rightText\":\"OPT 02\",\"rightImageUrl\":null},{\"id\":\"match_1779865397015_3\",\"leftText\":\"C\",\"leftImageUrl\":null,\"rightText\":\"OPT 03\",\"rightImageUrl\":null}]}', NULL, 60, 1, '2026-05-27 07:04:19'),
(257, 112, 1, 'multiple_choice', 'Which vitamin is produced when skin is exposed to sunlight?', NULL, NULL, '{\"options\":[\"Vitamin D\",\"Vitamin C\",\"Vitamin K\",\"Vitamin B12\"]}', '{\"correctAnswer\":0}', NULL, 30, 1, '2026-05-27 08:25:55'),
(258, 112, 2, 'sorting', 'Arrange the proper handwashing steps in the correct order.', NULL, NULL, '{\"items\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', '{\"correctOrder\":[\"Apply soap and rub palms\",\"Wet hands with clean water\",\"Rinse thoroughly and dry\",\"Scrub between fingers and under nails\"]}', NULL, 30, 1, '2026-05-27 08:25:55'),
(259, 112, 3, 'label_image', 'Label the key organs shown in this digestive system diagram.', 'Type the organ name for each numbered marker.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', '{\"labels\":[{\"id\":\"brain\",\"marker\":1,\"x\":58,\"y\":16,\"width\":20,\"height\":14,\"prompt\":\"Brain\",\"acceptedAnswers\":[\"Brain\"]},{\"id\":\"lungs\",\"marker\":2,\"x\":52,\"y\":33,\"width\":28,\"height\":18,\"prompt\":\"Lungs\",\"acceptedAnswers\":[\"Lungs\",\"Lung\"]},{\"id\":\"stomach\",\"marker\":3,\"x\":49,\"y\":53,\"width\":18,\"height\":14,\"prompt\":\"Stomach\",\"acceptedAnswers\":[\"Stomach\"]}]}', NULL, 30, 1, '2026-05-27 08:25:55');

-- --------------------------------------------------------

--
-- Table structure for table `session_score_events`
--

CREATE TABLE `session_score_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `session_id` bigint(20) UNSIGNED NOT NULL,
  `participant_id` bigint(20) UNSIGNED NOT NULL,
  `question_id` bigint(20) UNSIGNED DEFAULT NULL,
  `answer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `score_delta` int(11) NOT NULL,
  `event_type` enum('answer_score','bonus','penalty','adjustment') NOT NULL DEFAULT 'answer_score',
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `session_score_events`
--

INSERT INTO `session_score_events` (`id`, `session_id`, `participant_id`, `question_id`, `answer_id`, `score_delta`, `event_type`, `created_at`) VALUES
(122, 103, 126, 228, 208, 934, 'answer_score', '2026-05-27 03:17:57.187727'),
(123, 103, 126, 229, 209, 741, 'answer_score', '2026-05-27 03:18:24.199061'),
(124, 103, 126, 230, 210, 805, 'answer_score', '2026-05-27 03:18:55.154398'),
(125, 104, 127, 231, 211, 969, 'answer_score', '2026-05-27 03:38:38.464508'),
(126, 104, 128, 231, 212, 945, 'answer_score', '2026-05-27 03:38:42.131795'),
(127, 104, 129, 231, 213, 921, 'answer_score', '2026-05-27 03:38:45.652517'),
(128, 104, 130, 231, 214, 900, 'answer_score', '2026-05-27 03:38:48.753434'),
(129, 104, 127, 232, 215, 940, 'answer_score', '2026-05-27 03:40:59.184109'),
(130, 104, 130, 232, 217, 821, 'answer_score', '2026-05-27 03:41:17.054372'),
(131, 104, 127, 233, 218, 894, 'answer_score', '2026-05-27 03:42:20.273878'),
(132, 104, 128, 233, 219, 342, 'answer_score', '2026-05-27 03:42:37.413616'),
(133, 104, 129, 233, 220, 482, 'answer_score', '2026-05-27 03:42:56.052112'),
(134, 104, 130, 234, 221, 906, 'answer_score', '2026-05-27 03:51:14.573262'),
(135, 107, 132, 241, 226, 897, 'answer_score', '2026-05-27 06:33:12.960918'),
(136, 109, 134, 247, 228, 908, 'answer_score', '2026-05-27 06:57:07.408120'),
(137, 111, 135, 253, 230, 963, 'answer_score', '2026-05-27 07:06:04.126197'),
(138, 111, 136, 253, 231, 939, 'answer_score', '2026-05-27 07:06:07.764659'),
(139, 111, 137, 253, 232, 918, 'answer_score', '2026-05-27 07:06:10.896194'),
(140, 111, 138, 253, 233, 898, 'answer_score', '2026-05-27 07:06:13.859076'),
(141, 111, 135, 254, 234, 955, 'answer_score', '2026-05-27 07:11:30.706671'),
(142, 111, 138, 254, 236, 814, 'answer_score', '2026-05-27 07:11:51.866832'),
(143, 111, 137, 255, 238, 911, 'answer_score', '2026-05-27 07:13:51.635903'),
(144, 111, 135, 255, 239, 831, 'answer_score', '2026-05-27 07:14:07.671286'),
(145, 111, 136, 255, 240, 768, 'answer_score', '2026-05-27 07:14:20.267698'),
(146, 111, 136, 256, 242, 882, 'answer_score', '2026-05-27 07:15:23.417165'),
(147, 111, 137, 256, 243, 823, 'answer_score', '2026-05-27 07:15:35.106610');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `full_name`, `phone_number`, `created_at`, `updated_at`) VALUES
(30, 'kishore kathir', '+918122468276', '2026-05-27 03:17:33.253634', '2026-05-27 03:17:33.253634'),
(31, 'vishal', '+918778754770', '2026-05-27 03:37:48.053729', '2026-05-27 03:37:48.053729'),
(32, 'lakshmanan', '+91878549735141', '2026-05-27 03:38:09.412365', '2026-05-27 03:38:09.412365'),
(33, 'kishore kumar', '+91989282739', '2026-05-27 03:38:21.213242', '2026-05-27 03:38:21.213242'),
(34, 'vishal rao', '+91676372829', '2026-05-27 07:05:08.418565', '2026-05-27 07:05:08.418565'),
(35, 'kishore kumar S', '+91220233839', '2026-05-27 07:05:30.060926', '2026-05-27 07:05:30.060926'),
(36, 'lakashmanan', '+913626272910', '2026-05-27 07:05:45.783369', '2026-05-27 07:05:45.783369');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `participant_answers`
--
ALTER TABLE `participant_answers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_participant_answers_question_participant` (`question_id`,`participant_id`),
  ADD UNIQUE KEY `uq_participant_question` (`participant_id`,`question_id`),
  ADD KEY `idx_participant_answers_session_id` (`session_id`),
  ADD KEY `idx_participant_answers_participant_id` (`participant_id`),
  ADD KEY `fk_participant_answers_option` (`selected_option_id`),
  ADD KEY `idx_answers_question_participant` (`question_id`,`participant_id`),
  ADD KEY `idx_answers_session` (`session_id`),
  ADD KEY `idx_answers_count` (`session_id`,`question_id`),
  ADD KEY `idx_pa_session_question` (`session_id`,`question_id`);

--
-- Indexes for table `participant_question_option_orders`
--
ALTER TABLE `participant_question_option_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_participant_question_option_order` (`participant_id`,`question_id`),
  ADD KEY `idx_participant_question_option_orders_question_id` (`question_id`);

--
-- Indexes for table `question_options`
--
ALTER TABLE `question_options`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_question_options_order` (`question_id`,`display_order`),
  ADD KEY `idx_question_options_question_id` (`question_id`),
  ADD KEY `idx_question_options_question` (`question_id`);

--
-- Indexes for table `quiz_sessions`
--
ALTER TABLE `quiz_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_quiz_sessions_public_code` (`public_code`),
  ADD KEY `idx_quiz_sessions_admin_id` (`admin_id`),
  ADD KEY `idx_quiz_sessions_status` (`status`),
  ADD KEY `idx_quiz_sessions_created_at` (`created_at`),
  ADD KEY `fk_quiz_sessions_current_question` (`current_question_id`),
  ADD KEY `idx_sessions_code` (`public_code`);

--
-- Indexes for table `session_events`
--
ALTER TABLE `session_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_events_session_id` (`session_id`),
  ADD KEY `idx_session_events_participant_id` (`participant_id`),
  ADD KEY `idx_session_events_type_created_at` (`event_type`,`created_at`);

--
-- Indexes for table `session_participants`
--
ALTER TABLE `session_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_session_participants_join_token` (`join_token`),
  ADD KEY `idx_session_participants_session_id` (`session_id`),
  ADD KEY `idx_participants_token` (`join_token`),
  ADD KEY `idx_participants_session` (`session_id`),
  ADD KEY `idx_leaderboard` (`session_id`,`total_score`,`joined_at`,`id`),
  ADD KEY `idx_participant_lookup` (`session_id`,`join_token`),
  ADD KEY `idx_sp_leaderboard` (`session_id`,`total_score`,`joined_at`,`id`);

--
-- Indexes for table `session_questions`
--
ALTER TABLE `session_questions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_session_questions_order` (`session_id`,`display_order`),
  ADD KEY `idx_session_questions_session_id` (`session_id`),
  ADD KEY `idx_question_session` (`session_id`);

--
-- Indexes for table `session_score_events`
--
ALTER TABLE `session_score_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_score_events_session_id` (`session_id`),
  ADD KEY `idx_session_score_events_participant_id` (`participant_id`),
  ADD KEY `fk_session_score_events_question` (`question_id`),
  ADD KEY `fk_session_score_events_answer` (`answer_id`),
  ADD KEY `idx_score_events_session` (`session_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone_number` (`phone_number`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `participant_answers`
--
ALTER TABLE `participant_answers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=246;

--
-- AUTO_INCREMENT for table `participant_question_option_orders`
--
ALTER TABLE `participant_question_option_orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `question_options`
--
ALTER TABLE `question_options`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=473;

--
-- AUTO_INCREMENT for table `quiz_sessions`
--
ALTER TABLE `quiz_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=113;

--
-- AUTO_INCREMENT for table `session_events`
--
ALTER TABLE `session_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `session_participants`
--
ALTER TABLE `session_participants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=140;

--
-- AUTO_INCREMENT for table `session_questions`
--
ALTER TABLE `session_questions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=260;

--
-- AUTO_INCREMENT for table `session_score_events`
--
ALTER TABLE `session_score_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=148;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `participant_answers`
--
ALTER TABLE `participant_answers`
  ADD CONSTRAINT `fk_participant_answers_option` FOREIGN KEY (`selected_option_id`) REFERENCES `question_options` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_participant_answers_participant` FOREIGN KEY (`participant_id`) REFERENCES `session_participants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_participant_answers_question` FOREIGN KEY (`question_id`) REFERENCES `session_questions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_participant_answers_session` FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `participant_question_option_orders`
--
ALTER TABLE `participant_question_option_orders`
  ADD CONSTRAINT `fk_participant_question_option_orders_participant` FOREIGN KEY (`participant_id`) REFERENCES `session_participants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_participant_question_option_orders_question` FOREIGN KEY (`question_id`) REFERENCES `session_questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `question_options`
--
ALTER TABLE `question_options`
  ADD CONSTRAINT `fk_question_options_question` FOREIGN KEY (`question_id`) REFERENCES `session_questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_sessions`
--
ALTER TABLE `quiz_sessions`
  ADD CONSTRAINT `fk_quiz_sessions_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_quiz_sessions_current_question` FOREIGN KEY (`current_question_id`) REFERENCES `session_questions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `session_events`
--
ALTER TABLE `session_events`
  ADD CONSTRAINT `fk_session_events_participant` FOREIGN KEY (`participant_id`) REFERENCES `session_participants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_session_events_session` FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `session_participants`
--
ALTER TABLE `session_participants`
  ADD CONSTRAINT `fk_session_participants_session` FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `session_questions`
--
ALTER TABLE `session_questions`
  ADD CONSTRAINT `fk_session_questions_session` FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `session_score_events`
--
ALTER TABLE `session_score_events`
  ADD CONSTRAINT `fk_session_score_events_answer` FOREIGN KEY (`answer_id`) REFERENCES `participant_answers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_session_score_events_participant` FOREIGN KEY (`participant_id`) REFERENCES `session_participants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_session_score_events_question` FOREIGN KEY (`question_id`) REFERENCES `session_questions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_session_score_events_session` FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
