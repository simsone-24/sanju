-- phpMyAdmin SQL Dump
-- version 5.2.3deb1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 13, 2026 at 05:20 AM
-- Server version: 8.4.11-0ubuntu0.26.04.1
-- PHP Version: 8.5.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sanju_events`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int NOT NULL,
  `company_id` int DEFAULT NULL,
  `module` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int NOT NULL,
  `action` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `performed_by_id` int DEFAULT NULL,
  `performed_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `company_id`, `module`, `reference_id`, `action`, `description`, `metadata`, `performed_by_id`, `performed_at`) VALUES
(1, 1, 'AUTH', 1, 'LOGIN', 'Super Admin logged in.', NULL, 1, '2026-09-27 07:17:59.261'),
(2, 1, 'MASTERS', 1, 'CREATE', 'Event type \"wedding\" created.', NULL, 1, '2026-09-27 07:19:58.025'),
(3, 1, 'ENQUIRIES', 1, 'CREATE', 'Enquiry \"ENQ-2026-00001\" created.', NULL, 1, '2026-09-27 08:23:55.057'),
(4, 1, 'AUTH', 1, 'LOGIN', 'Super Admin logged in.', NULL, 1, '2026-10-05 15:52:06.211'),
(5, 1, 'AUTH', 1, 'LOGOUT', NULL, NULL, 1, '2026-10-05 16:03:26.330'),
(6, 1, 'AUTH', 1, 'LOGIN', 'Super Admin logged in.', NULL, 1, '2026-10-05 16:04:11.521'),
(7, 1, 'AUTH', 1, 'LOGOUT', NULL, NULL, 1, '2026-10-05 16:22:16.116'),
(8, 1, 'AUTH', 1, 'LOGIN', 'Super Admin logged in.', NULL, 1, '2026-10-05 16:34:31.984'),
(9, 1, 'USERS', 2, 'CREATE', 'User \"Infant raj\" (infant) created in group \"Super Admin\".', NULL, 1, '2026-10-05 16:37:50.052'),
(10, 1, 'AUTH', 2, 'LOGIN', 'Infant raj logged in.', NULL, 2, '2026-10-05 16:39:01.015'),
(11, 1, 'SETTINGS', 1, 'UPDATE', 'Company information updated.', NULL, 1, '2026-10-05 16:54:49.547'),
(12, 1, 'SETTINGS', 1, 'UPDATE', 'Company information updated.', NULL, 1, '2026-10-05 16:54:55.059'),
(13, 1, 'SETTINGS', 1, 'UPDATE', 'Company logo updated.', NULL, 1, '2026-10-05 16:55:13.353'),
(14, 1, 'ENQUIRIES', 1, 'DELETE', 'Enquiry \"ENQ-2026-00001\" deleted.', NULL, 1, '2026-10-05 16:56:27.096'),
(15, 1, 'MASTERS', 2, 'CREATE', 'Event type \"Birthday \" created.', NULL, 1, '2026-10-05 16:57:01.479'),
(16, 1, 'AUTH', 2, 'LOGIN', 'Infant raj logged in.', NULL, 2, '2026-10-06 07:12:43.063'),
(17, 1, 'USERS', 3, 'CREATE', 'User \"Manager\" (manager) created in group \"Super Admin\".', NULL, 1, '2026-10-06 07:23:17.945'),
(18, 1, 'AUTH', 2, 'LOGIN', 'Infant raj logged in.', NULL, 2, '2026-10-06 07:26:05.143'),
(19, 1, 'AUTH', 2, 'LOGIN', 'Infant raj logged in.', NULL, 2, '2026-10-06 07:29:37.256'),
(20, 1, 'ENQUIRIES', 2, 'CREATE', 'Enquiry \"ENQ-2026-00002\" created.', NULL, 2, '2026-10-06 08:10:56.147'),
(21, 1, 'ORDERS', 1, 'ORDER_CONVERSION', 'Order \"ORD-2026-00001\" created from enquiry \"ENQ-2026-00002\" without a quotation. Advance of 60000 carried over as receipt RCT-2026-00001.', NULL, 2, '2026-10-06 08:10:56.307'),
(22, 1, 'PAYMENTS', 1, 'CREATE', 'Payment of 60000 (ADVANCE) recorded for order \"ORD-2026-00001\" (receipt RCT-2026-00001), carried over from enquiry \"ENQ-2026-00002\".', NULL, 2, '2026-10-06 08:10:56.314'),
(23, 1, 'QUOTATIONS', 1, 'CREATE', 'Quotation \"QTN-2026-00001\" (v1) created from ENQUIRY.', NULL, 2, '2026-10-06 08:10:56.782'),
(24, 1, 'ENQUIRIES', 2, 'UPDATE', 'Enquiry \"ENQ-2026-00002\" updated.', NULL, 2, '2026-10-06 08:11:37.377'),
(25, 1, 'QUOTATIONS', 1, 'UPDATE', 'Quotation \"QTN-2026-00001\" (v1) updated.', NULL, 2, '2026-10-06 08:31:37.449'),
(26, 1, 'QUOTATIONS', 1, 'UPDATE', 'Quotation \"QTN-2026-00001\" (v1) updated.', NULL, 2, '2026-10-06 08:31:42.348'),
(27, 1, 'QUOTATIONS', 1, 'PRINT', 'Quotation PDF \"QTN-2026-00001-v1.pdf\" downloaded.', NULL, 2, '2026-10-06 08:38:06.402'),
(28, 1, 'QUOTATIONS', 1, 'PRINT', 'Quotation PDF \"QTN-2026-00001-v1.pdf\" downloaded.', NULL, 2, '2026-10-06 08:40:25.454'),
(29, 1, 'ENQUIRIES', 3, 'CREATE', 'Enquiry \"ENQ-2026-00003\" created.', NULL, 2, '2026-10-06 10:12:20.866'),
(30, 1, 'ORDERS', 2, 'ORDER_CONVERSION', 'Order \"ORD-2026-00002\" created from enquiry \"ENQ-2026-00003\" without a quotation. Advance of 5000 carried over as receipt RCT-2026-00002.', NULL, 2, '2026-10-06 10:12:20.966'),
(31, 1, 'PAYMENTS', 2, 'CREATE', 'Payment of 5000 (ADVANCE) recorded for order \"ORD-2026-00002\" (receipt RCT-2026-00002), carried over from enquiry \"ENQ-2026-00003\".', NULL, 2, '2026-10-06 10:12:20.977'),
(32, 1, 'QUOTATIONS', 2, 'CREATE', 'Quotation \"QTN-2026-00002\" (v1) created from ENQUIRY.', NULL, 2, '2026-10-06 10:12:21.139'),
(33, 1, 'ORDERS', 2, 'STATUS_CHANGE', 'Order \"ORD-2026-00002\" status changed from YET_TO_START to IN_PROGRESS.', '{\"from\":\"YET_TO_START\",\"to\":\"IN_PROGRESS\"}', 2, '2026-10-06 10:20:17.611'),
(34, 1, 'ORDERS', 1, 'STATUS_CHANGE', 'Order \"ORD-2026-00001\" status changed from YET_TO_START to IN_PROGRESS.', '{\"from\":\"YET_TO_START\",\"to\":\"IN_PROGRESS\"}', 2, '2026-10-06 10:22:10.759'),
(35, 1, 'QUOTATIONS', 3, 'CREATE', 'Quotation \"QTN-2026-00003\" (v1) created from MANUAL.', NULL, 2, '2026-10-06 12:06:02.500'),
(36, 1, 'QUOTATIONS', 3, 'STATUS_CHANGE', 'Quotation \"QTN-2026-00003\" (v1) marked as APPROVED.', NULL, 2, '2026-10-06 12:06:02.585'),
(37, 1, 'INVOICES', 2, 'CREATE', 'Invoice \"INV-2026-00001\" issued for order \"ORD-2026-00002\".', NULL, 1, '2026-10-09 10:32:43.640'),
(38, 1, 'ORDERS', 2, 'STATUS_CHANGE', 'Order \"ORD-2026-00002\" status changed from IN_PROGRESS to ORDER_CLOSED.', '{\"from\":\"IN_PROGRESS\",\"to\":\"ORDER_CLOSED\"}', 2, '2026-10-11 05:19:10.218'),
(39, 1, 'PAYMENT_TRACKER', 1, 'STATUS_CHANGE', 'Payment status for order \"ORD-2026-00001\" set to FULLY_PAID manually.', NULL, 2, '2026-10-11 05:21:51.389'),
(40, 1, 'PAYMENT_TRACKER', 1, 'STATUS_CHANGE', 'Payment status for order \"ORD-2026-00001\" set to PENDING manually.', NULL, 2, '2026-10-11 05:23:10.683'),
(41, 1, 'PAYMENT_TRACKER', 1, 'STATUS_CHANGE', 'Payment status for order \"ORD-2026-00001\" set to ADVANCE_PAID manually.', NULL, 2, '2026-10-11 05:23:46.677'),
(42, 1, 'ORDERS', 1, 'STATUS_CHANGE', 'Order \"ORD-2026-00001\" status changed from IN_PROGRESS to ORDER_CLOSED.', '{\"from\":\"IN_PROGRESS\",\"to\":\"ORDER_CLOSED\"}', 2, '2026-10-11 05:25:15.271'),
(43, 1, 'MASTERS', 3, 'CREATE', 'Event type \"haldhi\" created.', NULL, 2, '2026-10-11 05:27:59.434'),
(44, 1, 'MASTERS', 4, 'CREATE', 'Event type \"puberty \" created.', NULL, 2, '2026-10-11 05:28:38.864'),
(45, 1, 'MASTERS', 5, 'CREATE', 'Event type \"baby shower\" created.', NULL, 2, '2026-10-11 05:28:49.829'),
(46, 1, 'MASTERS', 6, 'CREATE', 'Event type \"engagement\" created.', NULL, 2, '2026-10-11 05:28:59.454'),
(47, 1, 'MASTERS', 7, 'CREATE', 'Event type \"home decoration\" created.', NULL, 2, '2026-10-11 05:29:24.123'),
(48, 1, 'MASTERS', 8, 'CREATE', 'Event type \"shop opening\" created.', NULL, 2, '2026-10-11 05:29:46.096'),
(49, 1, 'MASTERS', 9, 'CREATE', 'Event type \"Rotary meeting\" created.', NULL, 2, '2026-10-11 05:30:07.308'),
(50, 1, 'MASTERS', 10, 'CREATE', 'Event type \"others\" created.', NULL, 2, '2026-10-11 05:30:51.865'),
(51, 1, 'SETTINGS', 1, 'UPDATE', 'Company information updated.', NULL, 2, '2026-10-11 05:35:05.913'),
(52, 1, 'ENQUIRIES', 3, 'UPDATE', 'Enquiry \"ENQ-2026-00003\" updated.', NULL, 2, '2026-10-11 05:39:22.218'),
(53, 1, 'ENQUIRIES', 4, 'CREATE', 'Enquiry \"ENQ-2026-00004\" created.', NULL, 2, '2026-10-11 05:41:26.995'),
(54, 1, 'QUOTATIONS', 4, 'CREATE', 'Quotation \"QTN-2026-00004\" (v1) created from ENQUIRY.', NULL, 2, '2026-10-11 05:56:21.931'),
(55, 1, 'QUOTATIONS', 4, 'PRINT', 'Quotation PDF \"QTN-2026-00004-v1.pdf\" downloaded.', NULL, 2, '2026-10-11 05:57:01.231'),
(56, 1, 'ENQUIRIES', 4, 'UPDATE', 'Enquiry \"ENQ-2026-00004\" updated.', NULL, 2, '2026-10-11 05:58:10.157'),
(57, 1, 'ENQUIRIES', 4, 'STATUS_CHANGE', 'Enquiry \"ENQ-2026-00004\" status changed from DRAFT to ORDER_CONFIRMED.', NULL, 2, '2026-10-11 05:58:10.522'),
(58, 1, 'ORDERS', 3, 'ORDER_CONVERSION', 'Order \"ORD-2026-00003\" created from enquiry \"ENQ-2026-00004\" and quotation \"QTN-2026-00004\" (v1). Advance of 10000 carried over as receipt RCT-2026-00003.', NULL, 2, '2026-10-11 05:58:10.595'),
(59, 1, 'PAYMENTS', 3, 'CREATE', 'Payment of 10000 (ADVANCE) recorded for order \"ORD-2026-00003\" (receipt RCT-2026-00003), carried over from enquiry \"ENQ-2026-00004\".', NULL, 2, '2026-10-11 05:58:10.600'),
(60, 1, 'QUOTATIONS', 4, 'PRINT', 'Quotation PDF \"QTN-2026-00004-v1.pdf\" downloaded.', NULL, 2, '2026-10-11 05:59:30.800'),
(61, 1, 'QUOTATIONS', 4, 'UPDATE', 'Quotation \"QTN-2026-00004\" (v1) updated.', NULL, 2, '2026-10-11 06:01:40.589'),
(62, 1, 'ORDERS', 3, 'UPDATE', 'Order total changed to 30000 after quotation \"QTN-2026-00004\" (v1) was edited.', NULL, 2, '2026-10-11 06:01:40.595'),
(63, 1, 'QUOTATIONS', 4, 'APPROVE', 'Quotation \"QTN-2026-00004\" (v1) confirmed.', NULL, 2, '2026-10-11 06:01:40.623'),
(64, 1, 'QUOTATIONS', 4, 'UPDATE', '1 sample image(s) added to quotation \"QTN-2026-00004\".', NULL, 2, '2026-10-11 06:09:15.474'),
(65, 1, 'QUOTATIONS', 4, 'UPDATE', 'Quotation \"QTN-2026-00004\" (v1) updated.', NULL, 2, '2026-10-11 06:09:26.116'),
(66, 1, 'ORDERS', 3, 'UPDATE', 'Order total changed to 30000 after quotation \"QTN-2026-00004\" (v1) was edited.', NULL, 2, '2026-10-11 06:09:26.122'),
(67, 1, 'CUSTOMERS', 3, 'UPDATE', 'Customer \"JAIL CORNER\" updated.', NULL, 2, '2026-10-11 06:09:58.560'),
(68, 1, 'CUSTOMERS', 3, 'UPDATE', 'Customer \"JAIL CORNER\" updated.', NULL, 2, '2026-10-11 06:10:17.397'),
(69, 1, 'ENQUIRIES', 4, 'UPDATE', 'Enquiry \"ENQ-2026-00004\" updated.', NULL, 2, '2026-10-11 06:10:23.343'),
(70, 1, 'QUOTATIONS', 4, 'PRINT', 'Quotation PDF \"QTN-2026-00004-v1.pdf\" downloaded.', NULL, 2, '2026-10-11 06:10:38.377'),
(71, 1, 'ORDERS', 3, 'STATUS_CHANGE', 'Order \"ORD-2026-00003\" status changed from YET_TO_START to IN_PROGRESS.', '{\"from\":\"YET_TO_START\",\"to\":\"IN_PROGRESS\"}', 2, '2026-10-11 06:17:00.888'),
(72, 1, 'ENQUIRIES', 5, 'CREATE', 'Enquiry \"ENQ-2026-00005\" created.', NULL, 2, '2026-10-11 06:34:12.185'),
(73, 1, 'ORDERS', 4, 'ORDER_CONVERSION', 'Order \"ORD-2026-00004\" created from enquiry \"ENQ-2026-00005\" without a quotation.', NULL, 2, '2026-10-11 06:34:12.225'),
(74, 1, 'QUOTATIONS', 5, 'CREATE', 'Quotation \"QTN-2026-00005\" (v1) created from ENQUIRY.', NULL, 2, '2026-10-11 06:34:12.345'),
(75, 1, 'ENQUIRIES', 5, 'UPDATE', 'Enquiry \"ENQ-2026-00005\" updated.', NULL, 2, '2026-10-11 06:35:01.882'),
(76, 1, 'ENQUIRIES', 6, 'CREATE', 'Enquiry \"ENQ-2026-00006\" created.', NULL, 2, '2026-10-11 06:57:58.967'),
(77, 1, 'ORDERS', 5, 'ORDER_CONVERSION', 'Order \"ORD-2026-00005\" created from enquiry \"ENQ-2026-00006\" without a quotation. Advance of 1000 carried over as receipt RCT-2026-00004.', NULL, 2, '2026-10-11 06:57:59.026'),
(78, 1, 'PAYMENTS', 5, 'CREATE', 'Payment of 1000 (ADVANCE) recorded for order \"ORD-2026-00005\" (receipt RCT-2026-00004), carried over from enquiry \"ENQ-2026-00006\".', NULL, 2, '2026-10-11 06:57:59.029'),
(79, 1, 'QUOTATIONS', 6, 'CREATE', 'Quotation \"QTN-2026-00006\" (v1) created from ENQUIRY.', NULL, 2, '2026-10-11 06:57:59.166'),
(80, 1, 'ENQUIRIES', 6, 'UPDATE', 'Enquiry \"ENQ-2026-00006\" updated.', NULL, 2, '2026-10-11 06:58:04.994'),
(81, 1, 'QUOTATIONS', 6, 'UPDATE', '1 sample image(s) added to quotation \"QTN-2026-00006\".', NULL, 2, '2026-10-11 07:00:41.734'),
(82, 1, 'QUOTATIONS', 6, 'UPDATE', 'Quotation \"QTN-2026-00006\" (v1) updated.', NULL, 2, '2026-10-11 07:00:45.848'),
(83, 1, 'QUOTATIONS', 6, 'PRINT', 'Quotation PDF \"QTN-2026-00006-v1.pdf\" downloaded.', NULL, 2, '2026-10-11 07:01:33.734'),
(84, 1, 'ENQUIRIES', 7, 'CREATE', 'Enquiry \"ENQ-2026-00007\" created.', NULL, 2, '2026-10-11 07:19:49.700'),
(85, 1, 'ORDERS', 6, 'ORDER_CONVERSION', 'Order \"ORD-2026-00006\" created from enquiry \"ENQ-2026-00007\" without a quotation. Advance of 18000 carried over as receipt RCT-2026-00005.', NULL, 2, '2026-10-11 07:19:49.761'),
(86, 1, 'PAYMENTS', 6, 'CREATE', 'Payment of 18000 (ADVANCE) recorded for order \"ORD-2026-00006\" (receipt RCT-2026-00005), carried over from enquiry \"ENQ-2026-00007\".', NULL, 2, '2026-10-11 07:19:49.765'),
(87, 1, 'QUOTATIONS', 7, 'CREATE', 'Quotation \"QTN-2026-00007\" (v1) created from ENQUIRY.', NULL, 2, '2026-10-11 07:19:49.895'),
(88, 1, 'ENQUIRIES', 7, 'UPDATE', 'Enquiry \"ENQ-2026-00007\" updated.', NULL, 2, '2026-10-11 07:24:10.083'),
(89, 1, 'ENQUIRIES', 7, 'UPDATE', 'Enquiry \"ENQ-2026-00007\" updated.', NULL, 2, '2026-10-11 07:26:41.297'),
(90, 1, 'QUOTATIONS', 7, 'UPDATE', '1 sample image(s) added to quotation \"QTN-2026-00007\".', NULL, 2, '2026-10-11 07:31:07.429'),
(91, 1, 'QUOTATIONS', 7, 'UPDATE', 'Sample image removed from quotation \"QTN-2026-00007\".', NULL, 2, '2026-10-11 07:31:11.120'),
(92, 1, 'QUOTATIONS', 7, 'UPDATE', '1 sample image(s) added to quotation \"QTN-2026-00007\".', NULL, 2, '2026-10-11 07:41:54.099'),
(93, 1, 'QUOTATIONS', 7, 'UPDATE', '1 sample image(s) added to quotation \"QTN-2026-00007\".', NULL, 2, '2026-10-11 07:44:55.715'),
(94, 1, 'QUOTATIONS', 7, 'UPDATE', 'Quotation \"QTN-2026-00007\" (v1) updated.', NULL, 2, '2026-10-11 07:45:00.631'),
(95, 1, 'QUOTATIONS', 7, 'PRINT', 'Quotation PDF \"QTN-2026-00007-v1.pdf\" downloaded.', NULL, 2, '2026-10-11 07:45:23.849'),
(96, 1, 'ENQUIRIES', 8, 'CREATE', 'Enquiry \"ENQ-2026-00008\" created.', NULL, 2, '2026-10-11 07:59:30.630'),
(97, 1, 'ORDERS', 7, 'ORDER_CONVERSION', 'Order \"ORD-2026-00007\" created from enquiry \"ENQ-2026-00008\" without a quotation.', NULL, 2, '2026-10-11 07:59:30.664'),
(98, 1, 'QUOTATIONS', 8, 'CREATE', 'Quotation \"QTN-2026-00008\" (v1) created from ENQUIRY.', NULL, 2, '2026-10-11 07:59:30.788'),
(99, 1, 'ENQUIRIES', 8, 'UPDATE', 'Enquiry \"ENQ-2026-00008\" updated.', NULL, 2, '2026-10-11 07:59:37.757'),
(100, 1, 'QUOTATIONS', 8, 'UPDATE', 'Quotation \"QTN-2026-00008\" (v1) updated.', NULL, 2, '2026-10-11 07:59:56.856'),
(101, 1, 'ENQUIRIES', 9, 'CREATE', 'Enquiry \"ENQ-2026-00009\" created.', NULL, 2, '2026-10-11 09:51:02.720'),
(102, 1, 'ORDERS', 8, 'ORDER_CONVERSION', 'Order \"ORD-2026-00008\" created from enquiry \"ENQ-2026-00009\" without a quotation. Advance of 1500 carried over as receipt RCT-2026-00006.', NULL, 2, '2026-10-11 09:51:02.830'),
(103, 1, 'PAYMENTS', 8, 'CREATE', 'Payment of 1500 (ADVANCE) recorded for order \"ORD-2026-00008\" (receipt RCT-2026-00006), carried over from enquiry \"ENQ-2026-00009\".', NULL, 2, '2026-10-11 09:51:02.838'),
(104, 1, 'QUOTATIONS', 9, 'CREATE', 'Quotation \"QTN-2026-00009\" (v1) created from ENQUIRY.', NULL, 2, '2026-10-11 09:51:03.028'),
(105, 1, 'CUSTOMERS', 8, 'UPDATE', 'Customer \"P.VIGNESH & C.S.ABIRAMI \" updated.', NULL, 2, '2026-10-11 09:51:10.754'),
(106, 1, 'ENQUIRIES', 9, 'UPDATE', 'Enquiry \"ENQ-2026-00009\" updated.', NULL, 2, '2026-10-11 09:51:20.793'),
(107, 1, 'ENQUIRIES', 9, 'UPDATE', 'Enquiry \"ENQ-2026-00009\" updated.', NULL, 2, '2026-10-11 09:51:53.142'),
(108, 1, 'QUOTATIONS', 9, 'UPDATE', 'Quotation \"QTN-2026-00009\" (v1) updated.', NULL, 2, '2026-10-11 09:52:10.490'),
(109, 1, 'ENQUIRIES', 9, 'UPDATE', 'Enquiry \"ENQ-2026-00009\" updated.', NULL, 2, '2026-10-11 11:00:09.873'),
(110, 1, 'QUOTATIONS', 9, 'UPDATE', '1 sample image(s) added to quotation \"QTN-2026-00009\".', NULL, 2, '2026-10-11 11:02:02.510'),
(111, 1, 'QUOTATIONS', 9, 'UPDATE', 'Quotation \"QTN-2026-00009\" (v1) updated.', NULL, 2, '2026-10-11 11:02:07.218'),
(112, 1, 'ENQUIRIES', 5, 'UPDATE', 'Enquiry \"ENQ-2026-00005\" updated.', NULL, 2, '2026-10-12 04:59:21.651'),
(113, 1, 'ORDERS', 4, 'STATUS_CHANGE', 'Order \"ORD-2026-00004\" status changed from YET_TO_START to IN_PROGRESS.', '{\"from\":\"YET_TO_START\",\"to\":\"IN_PROGRESS\"}', 2, '2026-10-12 05:00:05.614'),
(114, 1, 'ENQUIRIES', 10, 'CREATE', 'Enquiry \"ENQ-2026-00010\" created.', NULL, 2, '2026-10-12 05:33:45.813'),
(115, 1, 'ORDERS', 9, 'ORDER_CONVERSION', 'Order \"ORD-2026-00009\" created from enquiry \"ENQ-2026-00010\" without a quotation. Advance of 5000 carried over as receipt RCT-2026-00007.', NULL, 2, '2026-10-12 05:33:45.896'),
(116, 1, 'PAYMENTS', 9, 'CREATE', 'Payment of 5000 (ADVANCE) recorded for order \"ORD-2026-00009\" (receipt RCT-2026-00007), carried over from enquiry \"ENQ-2026-00010\".', NULL, 2, '2026-10-12 05:33:45.900'),
(117, 1, 'QUOTATIONS', 10, 'CREATE', 'Quotation \"QTN-2026-00010\" (v1) created from ENQUIRY.', NULL, 2, '2026-10-12 05:33:46.204'),
(118, 1, 'ENQUIRIES', 10, 'UPDATE', 'Enquiry \"ENQ-2026-00010\" updated.', NULL, 2, '2026-10-12 05:33:54.859'),
(119, 1, 'ENQUIRIES', 10, 'UPDATE', 'Enquiry \"ENQ-2026-00010\" updated.', NULL, 2, '2026-10-12 05:34:14.544'),
(120, 1, 'QUOTATIONS', 10, 'UPDATE', '1 sample image(s) added to quotation \"QTN-2026-00010\".', NULL, 2, '2026-10-12 05:36:08.175'),
(121, 1, 'QUOTATIONS', 10, 'UPDATE', '1 sample image(s) added to quotation \"QTN-2026-00010\".', NULL, 2, '2026-10-12 05:36:13.846'),
(122, 1, 'QUOTATIONS', 10, 'UPDATE', '1 sample image(s) added to quotation \"QTN-2026-00010\".', NULL, 2, '2026-10-12 05:36:20.325'),
(123, 1, 'QUOTATIONS', 10, 'UPDATE', 'Quotation \"QTN-2026-00010\" (v1) updated.', NULL, 2, '2026-10-12 05:36:27.410'),
(124, 1, 'QUOTATIONS', 10, 'PRINT', 'Quotation PDF \"QTN-2026-00010-v1.pdf\" downloaded.', NULL, 2, '2026-10-12 05:37:03.502'),
(125, 1, 'QUOTATIONS', 10, 'UPDATE', 'Quotation \"QTN-2026-00010\" (v1) updated.', NULL, 2, '2026-10-12 05:38:54.689'),
(126, 1, 'ORDERS', 4, 'STATUS_CHANGE', 'Order \"ORD-2026-00004\" status changed from IN_PROGRESS to ORDER_CLOSED.', '{\"from\":\"IN_PROGRESS\",\"to\":\"ORDER_CLOSED\"}', 2, '2026-10-12 05:44:50.061'),
(127, 1, 'ENQUIRIES', 11, 'CREATE', 'Enquiry \"ENQ-2026-00011\" created.', NULL, 2, '2026-10-12 06:11:58.834'),
(128, 1, 'MASTERS', 11, 'CREATE', 'Event type \"naming ceremony\" created.', NULL, 2, '2026-10-12 06:13:58.345'),
(129, 1, 'QUOTATIONS', 11, 'CREATE', 'Quotation \"QTN-2026-00011\" (v1) created from ENQUIRY.', NULL, 2, '2026-10-12 11:22:41.705'),
(130, 1, 'ENQUIRIES', 11, 'UPDATE', 'Enquiry \"ENQ-2026-00011\" updated.', NULL, 2, '2026-10-12 11:23:32.311'),
(131, 1, 'ENQUIRIES', 11, 'STATUS_CHANGE', 'Enquiry \"ENQ-2026-00011\" status changed from DRAFT to ORDER_CONFIRMED.', NULL, 2, '2026-10-12 11:23:32.462'),
(132, 1, 'ORDERS', 10, 'ORDER_CONVERSION', 'Order \"ORD-2026-00010\" created from enquiry \"ENQ-2026-00011\" and quotation \"QTN-2026-00011\" (v1). Advance of 1000 carried over as receipt RCT-2026-00008.', NULL, 2, '2026-10-12 11:23:32.621'),
(133, 1, 'PAYMENTS', 10, 'CREATE', 'Payment of 1000 (ADVANCE) recorded for order \"ORD-2026-00010\" (receipt RCT-2026-00008), carried over from enquiry \"ENQ-2026-00011\".', NULL, 2, '2026-10-12 11:23:32.626'),
(134, 1, 'QUOTATIONS', 11, 'UPDATE', '1 sample image(s) added to quotation \"QTN-2026-00011\".', NULL, 2, '2026-10-12 11:26:03.671'),
(135, 1, 'QUOTATIONS', 11, 'UPDATE', '1 sample image(s) added to quotation \"QTN-2026-00011\".', NULL, 2, '2026-10-12 11:26:10.231'),
(136, 1, 'QUOTATIONS', 11, 'UPDATE', 'Quotation \"QTN-2026-00011\" (v1) updated.', NULL, 2, '2026-10-12 11:26:13.094'),
(137, 1, 'ORDERS', 10, 'UPDATE', 'Order total changed to 18000 after quotation \"QTN-2026-00011\" (v1) was edited.', NULL, 2, '2026-10-12 11:26:13.103'),
(138, 1, 'ENQUIRIES', 12, 'CREATE', 'Enquiry \"ENQ-2026-00012\" created.', NULL, 2, '2026-10-12 11:46:00.945'),
(139, 1, 'ORDERS', 11, 'ORDER_CONVERSION', 'Order \"ORD-2026-00011\" created from enquiry \"ENQ-2026-00012\" without a quotation. Advance of 20000 carried over as receipt RCT-2026-00009.', NULL, 2, '2026-10-12 11:46:01.040'),
(140, 1, 'PAYMENTS', 11, 'CREATE', 'Payment of 20000 (ADVANCE) recorded for order \"ORD-2026-00011\" (receipt RCT-2026-00009), carried over from enquiry \"ENQ-2026-00012\".', NULL, 2, '2026-10-12 11:46:01.049'),
(141, 1, 'QUOTATIONS', 12, 'CREATE', 'Quotation \"QTN-2026-00012\" (v1) created from ENQUIRY.', NULL, 2, '2026-10-12 11:46:01.299'),
(142, 1, 'ENQUIRIES', 12, 'UPDATE', 'Enquiry \"ENQ-2026-00012\" updated.', NULL, 2, '2026-10-12 11:46:05.968'),
(143, 1, 'ENQUIRIES', 12, 'UPDATE', 'Enquiry \"ENQ-2026-00012\" updated.', NULL, 2, '2026-10-12 11:53:39.225'),
(144, 1, 'ENQUIRIES', 12, 'UPDATE', 'Enquiry \"ENQ-2026-00012\" updated.', NULL, 2, '2026-10-12 11:54:07.557'),
(145, 1, 'QUOTATIONS', 12, 'UPDATE', '1 sample image(s) added to quotation \"QTN-2026-00012\".', NULL, 2, '2026-10-12 11:54:44.003'),
(146, 1, 'QUOTATIONS', 12, 'UPDATE', 'Quotation \"QTN-2026-00012\" (v1) updated.', NULL, 2, '2026-10-12 11:54:46.431'),
(147, 1, 'ENQUIRIES', 13, 'CREATE', 'Enquiry \"ENQ-2026-00013\" created.', NULL, 2, '2026-10-12 12:06:58.195'),
(148, 1, 'ORDERS', 12, 'ORDER_CONVERSION', 'Order \"ORD-2026-00012\" created from enquiry \"ENQ-2026-00013\" without a quotation.', NULL, 2, '2026-10-12 12:06:58.241'),
(149, 1, 'QUOTATIONS', 13, 'CREATE', 'Quotation \"QTN-2026-00013\" (v1) created from ENQUIRY.', NULL, 2, '2026-10-12 12:06:58.415'),
(150, 1, 'ENQUIRIES', 13, 'UPDATE', 'Enquiry \"ENQ-2026-00013\" updated.', NULL, 2, '2026-10-12 12:07:13.592'),
(151, 1, 'ENQUIRIES', 13, 'UPDATE', 'Enquiry \"ENQ-2026-00013\" updated.', NULL, 2, '2026-10-12 12:09:06.368'),
(152, 1, 'QUOTATIONS', 13, 'UPDATE', 'Quotation \"QTN-2026-00013\" (v1) updated.', NULL, 2, '2026-10-12 12:09:55.977'),
(153, 1, 'CUSTOMERS', 12, 'UPDATE', 'Customer \"MC-CLARION\" updated.', NULL, 2, '2026-10-12 12:11:58.171'),
(154, 1, 'ENQUIRIES', 14, 'CREATE', 'Enquiry \"ENQ-2026-00014\" created.', NULL, 2, '2026-10-12 12:20:16.462'),
(155, 1, 'ORDERS', 13, 'ORDER_CONVERSION', 'Order \"ORD-2026-00013\" created from enquiry \"ENQ-2026-00014\" without a quotation. Advance of 5000 carried over as receipt RCT-2026-00010.', NULL, 2, '2026-10-12 12:20:16.565'),
(156, 1, 'PAYMENTS', 13, 'CREATE', 'Payment of 5000 (ADVANCE) recorded for order \"ORD-2026-00013\" (receipt RCT-2026-00010), carried over from enquiry \"ENQ-2026-00014\".', NULL, 2, '2026-10-12 12:20:16.581'),
(157, 1, 'QUOTATIONS', 14, 'CREATE', 'Quotation \"QTN-2026-00014\" (v1) created from ENQUIRY.', NULL, 2, '2026-10-12 12:20:16.797'),
(158, 1, 'ENQUIRIES', 14, 'UPDATE', 'Enquiry \"ENQ-2026-00014\" updated.', NULL, 2, '2026-10-12 12:21:04.979'),
(159, 1, 'QUOTATIONS', 14, 'UPDATE', '1 sample image(s) added to quotation \"QTN-2026-00014\".', NULL, 2, '2026-10-12 12:21:31.932'),
(160, 1, 'QUOTATIONS', 14, 'UPDATE', 'Quotation \"QTN-2026-00014\" (v1) updated.', NULL, 2, '2026-10-12 12:21:34.429'),
(161, 1, 'ORDERS', 3, 'STATUS_CHANGE', 'Order \"ORD-2026-00003\" status changed from IN_PROGRESS to ORDER_CLOSED.', '{\"from\":\"IN_PROGRESS\",\"to\":\"ORDER_CLOSED\"}', 2, '2026-10-12 12:22:55.474'),
(162, 1, 'ENQUIRIES', 15, 'CREATE', 'Enquiry \"ENQ-2026-00015\" created.', NULL, 2, '2026-10-12 15:12:22.427'),
(163, 1, 'ORDERS', 14, 'ORDER_CONVERSION', 'Order \"ORD-2026-00014\" created from enquiry \"ENQ-2026-00015\" without a quotation. Advance of 4000 carried over as receipt RCT-2026-00011.', NULL, 2, '2026-10-12 15:12:22.497'),
(164, 1, 'PAYMENTS', 14, 'CREATE', 'Payment of 4000 (ADVANCE) recorded for order \"ORD-2026-00014\" (receipt RCT-2026-00011), carried over from enquiry \"ENQ-2026-00015\".', NULL, 2, '2026-10-12 15:12:22.502'),
(165, 1, 'QUOTATIONS', 15, 'CREATE', 'Quotation \"QTN-2026-00015\" (v1) created from ENQUIRY.', NULL, 2, '2026-10-12 15:12:22.811'),
(166, 1, 'QUOTATIONS', 15, 'PRINT', 'Quotation PDF \"QTN-2026-00015-v1.pdf\" downloaded.', NULL, 2, '2026-10-12 15:16:46.014'),
(167, 1, 'QUOTATIONS', 15, 'PRINT', 'Quotation PDF \"QTN-2026-00015-v1.pdf\" downloaded.', NULL, 2, '2026-10-12 15:17:21.829'),
(168, 1, 'QUOTATIONS', 15, 'PRINT', 'Quotation PDF \"QTN-2026-00015-v1.pdf\" downloaded.', NULL, 2, '2026-10-12 15:21:37.709'),
(169, 1, 'QUOTATIONS', 4, 'PRINT', 'Quotation PDF \"QTN-2026-00004-v1.pdf\" downloaded.', NULL, 2, '2026-10-12 15:55:34.976'),
(170, 1, 'QUOTATIONS', 4, 'PRINT', 'Quotation PDF \"QTN-2026-00004-v1.pdf\" downloaded.', NULL, 2, '2026-10-12 15:55:49.180');

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int NOT NULL,
  `company_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `logo` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gst_number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_branch` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_ifsc` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_upi` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `authorized_signatory` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `footer_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `terms_and_conditions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('ACTIVE','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `company_name`, `contact_person`, `mobile`, `email`, `address`, `logo`, `gst_number`, `website`, `bank_name`, `bank_account_name`, `bank_account_number`, `bank_branch`, `bank_ifsc`, `bank_upi`, `authorized_signatory`, `footer_message`, `terms_and_conditions`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Sanju Events & Decoration', NULL, NULL, NULL, NULL, 'company/1791219312649-562421039.jpg', NULL, NULL, 'AXIS BANK', NULL, '922020020026184', 'KK NAGAR', 'UTIB0002695', NULL, NULL, NULL, NULL, 'ACTIVE', '2026-09-27 07:12:26.899', '2026-10-11 05:35:05.899');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `customer_code` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `whatsapp` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `city` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('ACTIVE','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `company_id`, `customer_code`, `customer_name`, `mobile`, `whatsapp`, `email`, `address`, `city`, `remarks`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'CUS-2026-00001', 'STEPHAN', '9677872163', '9677872163', NULL, 'MANARGUDI', 'MANARGUDI', NULL, 'ACTIVE', '2026-10-06 08:10:56.100', '2026-10-06 08:10:56.100', NULL),
(2, 1, 'CUS-2026-00002', 'VISION EVENT', '7402594615', '7402594615', NULL, 'DHANALAKSHMI SRINIVASAN COLLEGE', 'PERAMBALUR', NULL, 'ACTIVE', '2026-10-06 10:12:20.854', '2026-10-06 10:12:20.854', NULL),
(3, 1, 'CUS-2026-00003', 'JAIL CORNER', '8122449309', '9750527254', NULL, NULL, 'TRICHY-4', NULL, 'ACTIVE', '2026-10-11 05:58:10.510', '2026-10-11 06:10:17.385', NULL),
(4, 1, 'CUS-2026-00004', 'SENTHILKUMAR HOME', '8754267943', '8754267943', NULL, NULL, 'TRICHY', NULL, 'ACTIVE', '2026-10-11 06:34:12.176', '2026-10-11 06:34:12.176', NULL),
(5, 1, 'CUS-2026-00005', 'NIKKIETHA', '9962691442', '9962691442', NULL, NULL, 'TRICHY', NULL, 'ACTIVE', '2026-10-11 06:57:58.955', '2026-10-11 06:57:58.955', NULL),
(6, 1, 'CUS-2026-00006', 'HEMMINGER', '9342918709', '9342918709', NULL, NULL, 'TRICHY', NULL, 'ACTIVE', '2026-10-11 07:19:49.690', '2026-10-11 07:19:49.690', NULL),
(7, 1, 'CUS-2026-00007', 'ELITE HARI', '9865907104', '9865907104', NULL, NULL, 'TRICHY', NULL, 'ACTIVE', '2026-10-11 07:59:30.620', '2026-10-11 07:59:30.620', NULL),
(8, 1, 'CUS-2026-00008', 'P.VIGNESH & C.S.ABIRAMI', '8012777957', '8012777957', NULL, NULL, 'TRICHY', NULL, 'ACTIVE', '2026-10-11 09:51:02.707', '2026-10-11 09:51:10.747', NULL),
(9, 1, 'CUS-2026-00009', 'SHINY SUJI', '8220919165', '8220919165', NULL, NULL, 'THANJAVUR', NULL, 'ACTIVE', '2026-10-12 05:33:45.790', '2026-10-12 05:33:45.790', NULL),
(10, 1, 'CUS-2026-00010', 'ANTHONY', '7639358013', '7639358013', NULL, NULL, 'TRICHY', NULL, 'ACTIVE', '2026-10-12 11:23:32.439', '2026-10-12 11:23:32.439', NULL),
(11, 1, 'CUS-2026-00011', 'VENKATESH RAM', '7402268139', '7402268139', NULL, NULL, 'PUDUKKOTTAI', NULL, 'ACTIVE', '2026-10-12 11:46:00.924', '2026-10-12 11:46:00.924', NULL),
(12, 1, 'CUS-2026-00012', 'MC-CLARION', '9952188393', '9952188393', NULL, NULL, 'TRICHY', NULL, 'ACTIVE', '2026-10-12 12:06:58.180', '2026-10-12 12:11:58.149', NULL),
(13, 1, 'CUS-2026-00013', 'AADHAV ILAMARAN', '9043331789', '9043331789', NULL, NULL, 'TRICHY', NULL, 'ACTIVE', '2026-10-12 12:20:16.448', '2026-10-12 12:20:16.448', NULL),
(14, 1, 'CUS-2026-00014', 'Yazhini', '9994204259', '9994204259', NULL, NULL, 'Trichy', NULL, 'ACTIVE', '2026-10-12 15:12:22.412', '2026-10-12 15:12:22.412', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `document_sequences`
--

CREATE TABLE `document_sequences` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `sequence_type` enum('ENQUIRY','QUOTATION','ORDER','RECEIPT','INVOICE','CUSTOMER','RENT_OUT','RENT_RETURN','RENT_PAYMENT') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int NOT NULL,
  `last_number` int NOT NULL DEFAULT '0',
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `document_sequences`
--

INSERT INTO `document_sequences` (`id`, `company_id`, `sequence_type`, `year`, `last_number`, `updated_at`) VALUES
(1, 1, 'ENQUIRY', 2026, 15, '2026-10-12 15:12:22.385'),
(2, 1, 'CUSTOMER', 2026, 14, '2026-10-12 15:12:22.402'),
(3, 1, 'ORDER', 2026, 14, '2026-10-12 15:12:22.444'),
(4, 1, 'RECEIPT', 2026, 11, '2026-10-12 15:12:22.448'),
(5, 1, 'QUOTATION', 2026, 15, '2026-10-12 15:12:22.730'),
(6, 1, 'INVOICE', 2026, 1, '2026-10-09 10:32:43.557');

-- --------------------------------------------------------

--
-- Table structure for table `enquiries`
--

CREATE TABLE `enquiries` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `enquiry_number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int DEFAULT NULL,
  `event_type_id` int DEFAULT NULL,
  `prospect_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prospect_mobile` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prospect_whatsapp` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prospect_email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prospect_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `prospect_city` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_date` datetime(3) DEFAULT NULL,
  `event_time` enum('MORNING','EVENING') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mahal` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venue` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated_budget` decimal(12,2) DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `appointment_date` datetime(3) DEFAULT NULL,
  `appointment_time` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meeting_location` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appointment_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `appointment_status` enum('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `assigned_user_id` int DEFAULT NULL,
  `quotation_amount` decimal(12,2) DEFAULT NULL,
  `quotation_version` int DEFAULT NULL,
  `final_budget_amount` decimal(12,2) DEFAULT NULL,
  `advance_amount` decimal(12,2) DEFAULT NULL,
  `follow_up_date` datetime(3) DEFAULT NULL,
  `status` enum('DRAFT','PENDING','APPOINTMENT_FIXED','QUOTATION_TO_SHARE','QUOTATION_SHARED','ORDER_CONFIRMED','ORDER_LOST') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `enquiries`
--

INSERT INTO `enquiries` (`id`, `company_id`, `enquiry_number`, `customer_id`, `event_type_id`, `prospect_name`, `prospect_mobile`, `prospect_whatsapp`, `prospect_email`, `prospect_address`, `prospect_city`, `event_name`, `event_date`, `event_time`, `mahal`, `venue`, `estimated_budget`, `notes`, `appointment_date`, `appointment_time`, `meeting_location`, `appointment_notes`, `appointment_status`, `assigned_user_id`, `quotation_amount`, `quotation_version`, `final_budget_amount`, `advance_amount`, `follow_up_date`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'ENQ-2026-00001', NULL, NULL, 'Simsone jeyaseelan', NULL, NULL, 'jeyaseelansimsone@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, NULL, NULL, NULL, NULL, NULL, 'DRAFT', '2026-09-27 08:23:54.967', '2026-10-05 16:56:27.086', '2026-10-05 16:56:27.081'),
(2, 1, 'ENQ-2026-00002', 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-07 00:00:00.000', 'MORNING', 'MALAR MAHAL', 'MANARGUDI', 100000.00, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, 100000.00, 1, 100000.00, 60000.00, '2026-10-06 00:00:00.000', 'ORDER_CONFIRMED', '2026-10-06 08:10:56.112', '2026-10-06 08:31:42.290', NULL),
(3, 1, 'ENQ-2026-00003', 2, 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-07 00:00:00.000', 'EVENING', 'COLLEGE', 'PERAMBALUR', 47000.00, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 47000.00, 1, 47000.00, 5000.00, NULL, 'ORDER_CONFIRMED', '2026-10-06 10:12:20.856', '2026-10-11 05:39:22.206', NULL),
(4, 1, 'ENQ-2026-00004', 3, 1, 'JAIL CORNER', '8122449309', '9750527254', NULL, NULL, 'TRICHY-4', NULL, '2026-10-12 00:00:00.000', 'MORNING', 'HOME', 'JAILCORNER TRICHY', 30000.00, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 30000.00, 1, 30000.00, 10000.00, NULL, 'ORDER_CONFIRMED', '2026-10-11 05:41:26.982', '2026-10-11 06:10:23.326', NULL),
(5, 1, 'ENQ-2026-00005', 4, 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-12 00:00:00.000', 'MORNING', 'HOME', 'TRICHY', 10000.00, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 10000.00, 1, 10000.00, 0.00, NULL, 'ORDER_CONFIRMED', '2026-10-11 06:34:12.179', '2026-10-12 04:59:21.604', NULL),
(6, 1, 'ENQ-2026-00006', 5, 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-14 00:00:00.000', 'MORNING', 'ARUN HOTEL -MAXI HALL', 'ARUN HOTEL', 10000.00, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 10000.00, 1, 10000.00, 1000.00, NULL, 'ORDER_CONFIRMED', '2026-10-11 06:57:58.957', '2026-10-11 07:00:45.779', NULL),
(7, 1, 'ENQ-2026-00007', 6, 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-17 00:00:00.000', 'EVENING', 'GOLDEN WOODS', 'MORAIS CITY', 18000.00, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 18000.00, 1, 18000.00, 18000.00, NULL, 'ORDER_CONFIRMED', '2026-10-11 07:19:49.693', '2026-10-11 07:45:00.551', NULL),
(8, 1, 'ENQ-2026-00008', 7, 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-17 00:00:00.000', 'EVENING', NULL, 'HARI FACTORY', 20200.00, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 20200.00, 1, 20200.00, NULL, NULL, 'ORDER_CONFIRMED', '2026-10-11 07:59:30.624', '2026-10-11 07:59:56.813', NULL),
(9, 1, 'ENQ-2026-00009', 8, 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-25 00:00:00.000', 'MORNING', 'SUMANGALI RESIDENCY', 'TVS TOLLGATE', 7500.00, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 7500.00, 1, 7500.00, 1500.00, NULL, 'ORDER_CONFIRMED', '2026-10-11 09:51:02.710', '2026-10-11 11:02:07.144', NULL),
(10, 1, 'ENQ-2026-00010', 9, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-25 00:00:00.000', 'MORNING', 'BALAJI MAHAL,VALLAM.', 'BALAJI MAHAL,VALLAM.', 82500.00, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 82500.00, 1, 82500.00, 5000.00, NULL, 'ORDER_CONFIRMED', '2026-10-12 05:33:45.798', '2026-10-12 05:38:54.543', NULL),
(11, 1, 'ENQ-2026-00011', 10, 11, 'ANTHONY', '7639358013', '7639358013', NULL, NULL, 'TRICHY', NULL, '2026-11-08 00:00:00.000', 'MORNING', 'HOTEL KANNAPPA', 'HOTEL KANNAPPA', 18000.00, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 18000.00, 1, 18000.00, 1000.00, NULL, 'ORDER_CONFIRMED', '2026-10-12 06:11:58.825', '2026-10-12 11:26:12.935', NULL),
(12, 1, 'ENQ-2026-00012', 11, 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-25 00:00:00.000', 'MORNING', 'SRI AMMAN MAHAL', 'THIRUVAPPUR, PUDUKKOTTAI.', 40000.00, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 40000.00, 1, 40000.00, 20000.00, NULL, 'ORDER_CONFIRMED', '2026-10-12 11:46:00.933', '2026-10-12 11:54:46.332', NULL),
(13, 1, 'ENQ-2026-00013', 12, 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-25 00:00:00.000', 'MORNING', 'MC', 'MC', 34140.00, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 34140.00, 1, 34140.00, NULL, NULL, 'ORDER_CONFIRMED', '2026-10-12 12:06:58.185', '2026-10-12 12:09:55.934', NULL),
(14, 1, 'ENQ-2026-00014', 13, 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-12 00:00:00.000', 'EVENING', 'HOME', 'KK NAGAR ', 10000.00, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 10000.00, 1, 10000.00, 5000.00, NULL, 'ORDER_CONFIRMED', '2026-10-12 12:20:16.452', '2026-10-12 12:21:34.378', NULL),
(15, 1, 'ENQ-2026-00015', 14, 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-14 00:00:00.000', 'MORNING', 'Golden woods ', 'Morals city', 8500.00, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 8500.00, 1, 8500.00, 4000.00, NULL, 'ORDER_CONFIRMED', '2026-10-12 15:12:22.418', '2026-10-12 15:12:22.750', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `enquiry_followups`
--

CREATE TABLE `enquiry_followups` (
  `id` int NOT NULL,
  `enquiry_id` int NOT NULL,
  `follow_up_date` datetime(3) NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `outcome` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_id` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_types`
--

CREATE TABLE `event_types` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `event_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `color_code` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `status` enum('ACTIVE','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_types`
--

INSERT INTO `event_types` (`id`, `company_id`, `event_name`, `color_code`, `display_order`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'wedding', NULL, 0, 'ACTIVE', '2026-09-27 07:19:58.009', '2026-09-27 07:19:58.009', NULL),
(2, 1, 'Birthday ', NULL, 0, 'ACTIVE', '2026-10-05 16:57:01.454', '2026-10-05 16:57:01.454', NULL),
(3, 1, 'haldhi', NULL, 0, 'ACTIVE', '2026-10-11 05:27:59.428', '2026-10-11 05:27:59.428', NULL),
(4, 1, 'puberty ', NULL, 0, 'ACTIVE', '2026-10-11 05:28:38.856', '2026-10-11 05:28:38.856', NULL),
(5, 1, 'baby shower', NULL, 0, 'ACTIVE', '2026-10-11 05:28:49.823', '2026-10-11 05:28:49.823', NULL),
(6, 1, 'engagement', NULL, 0, 'ACTIVE', '2026-10-11 05:28:59.445', '2026-10-11 05:28:59.445', NULL),
(7, 1, 'home decoration', NULL, 0, 'ACTIVE', '2026-10-11 05:29:24.117', '2026-10-11 05:29:24.117', NULL),
(8, 1, 'shop opening', NULL, 0, 'ACTIVE', '2026-10-11 05:29:46.090', '2026-10-11 05:29:46.090', NULL),
(9, 1, 'Rotary meeting', NULL, 0, 'ACTIVE', '2026-10-11 05:30:07.281', '2026-10-11 05:30:07.281', NULL),
(10, 1, 'others', NULL, 0, 'ACTIVE', '2026-10-11 05:30:51.860', '2026-10-11 05:30:51.860', NULL),
(11, 1, 'naming ceremony', NULL, 0, 'ACTIVE', '2026-10-12 06:13:58.337', '2026-10-12 06:13:58.337', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `order_id` int NOT NULL,
  `invoice_number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_date` datetime(3) NOT NULL,
  `issued_by_id` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `company_id`, `order_id`, `invoice_number`, `invoice_date`, `issued_by_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 2, 'INV-2026-00001', '2026-10-09 10:32:43.616', 1, '2026-10-09 10:32:43.618', '2026-10-09 10:32:43.618', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `order_number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `enquiry_id` int NOT NULL,
  `quotation_id` int DEFAULT NULL,
  `customer_id` int NOT NULL,
  `event_date` datetime(3) DEFAULT NULL,
  `venue` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `total_amount` decimal(12,2) NOT NULL,
  `paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `pending_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `coordinator_id` int DEFAULT NULL,
  `cancellation_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('YET_TO_START','IN_PROGRESS','ORDER_CLOSED','REJECTED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'YET_TO_START',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `company_id`, `order_number`, `enquiry_id`, `quotation_id`, `customer_id`, `event_date`, `venue`, `notes`, `remarks`, `total_amount`, `paid_amount`, `pending_amount`, `coordinator_id`, `cancellation_reason`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'ORD-2026-00001', 2, NULL, 1, '2026-10-07 00:00:00.000', 'MANARGUDI', NULL, NULL, 100000.00, 60000.00, 40000.00, NULL, NULL, 'ORDER_CLOSED', '2026-10-06 08:10:56.214', '2026-10-11 05:25:15.255', NULL),
(2, 1, 'ORD-2026-00002', 3, NULL, 2, '2026-10-07 00:00:00.000', 'PERAMBALUR', NULL, NULL, 47000.00, 5000.00, 42000.00, NULL, NULL, 'ORDER_CLOSED', '2026-10-06 10:12:20.905', '2026-10-11 05:19:10.164', NULL),
(3, 1, 'ORD-2026-00003', 4, 4, 3, '2026-10-12 00:00:00.000', 'JAILCORNER TRICHY', NULL, NULL, 30000.00, 10000.00, 20000.00, NULL, NULL, 'ORDER_CLOSED', '2026-10-11 05:58:10.558', '2026-10-12 12:22:55.465', NULL),
(4, 1, 'ORD-2026-00004', 5, NULL, 4, '2026-10-12 00:00:00.000', 'TRICHY', NULL, NULL, 10000.00, 0.00, 10000.00, NULL, NULL, 'ORDER_CLOSED', '2026-10-11 06:34:12.205', '2026-10-12 05:44:50.050', NULL),
(5, 1, 'ORD-2026-00005', 6, NULL, 5, '2026-10-14 00:00:00.000', 'ARUN HOTEL', NULL, NULL, 10000.00, 1000.00, 9000.00, NULL, NULL, 'YET_TO_START', '2026-10-11 06:57:58.995', '2026-10-11 06:57:59.009', NULL),
(6, 1, 'ORD-2026-00006', 7, NULL, 6, '2026-10-17 00:00:00.000', 'MORAIS CITY', NULL, NULL, 18000.00, 18000.00, 0.00, NULL, NULL, 'YET_TO_START', '2026-10-11 07:19:49.732', '2026-10-11 07:19:49.742', NULL),
(7, 1, 'ORD-2026-00007', 8, NULL, 7, '2026-10-17 00:00:00.000', 'HARI FACTORY', NULL, NULL, 20200.00, 0.00, 20200.00, NULL, NULL, 'YET_TO_START', '2026-10-11 07:59:30.649', '2026-10-11 07:59:30.649', NULL),
(8, 1, 'ORD-2026-00008', 9, NULL, 8, '2026-10-25 00:00:00.000', 'TVS TOLLGATE', NULL, NULL, 7500.00, 1500.00, 6000.00, NULL, NULL, 'YET_TO_START', '2026-10-11 09:51:02.754', '2026-10-11 09:51:02.779', NULL),
(9, 1, 'ORD-2026-00009', 10, NULL, 9, '2026-10-25 00:00:00.000', 'BALAJI MAHAL,VALLAM.', NULL, NULL, 82500.00, 5000.00, 77500.00, NULL, NULL, 'YET_TO_START', '2026-10-12 05:33:45.841', '2026-10-12 05:33:45.861', NULL),
(10, 1, 'ORD-2026-00010', 11, 11, 10, '2026-11-08 00:00:00.000', 'HOTEL KANNAPPA', NULL, NULL, 18000.00, 1000.00, 17000.00, NULL, NULL, 'YET_TO_START', '2026-10-12 11:23:32.531', '2026-10-12 11:26:12.946', NULL),
(11, 1, 'ORD-2026-00011', 12, NULL, 11, '2026-10-25 00:00:00.000', 'THIRUVAPPUR, PUDUKKOTTAI.', NULL, NULL, 40000.00, 20000.00, 20000.00, NULL, NULL, 'YET_TO_START', '2026-10-12 11:46:00.981', '2026-10-12 11:46:00.997', NULL),
(12, 1, 'ORD-2026-00012', 13, NULL, 12, '2026-10-25 00:00:00.000', 'MC', NULL, NULL, 34140.00, 0.00, 34140.00, NULL, NULL, 'YET_TO_START', '2026-10-12 12:06:58.222', '2026-10-12 12:06:58.222', NULL),
(13, 1, 'ORD-2026-00013', 14, NULL, 13, '2026-10-12 00:00:00.000', 'KK NAGAR ', NULL, NULL, 10000.00, 5000.00, 5000.00, NULL, NULL, 'YET_TO_START', '2026-10-12 12:20:16.510', '2026-10-12 12:20:16.523', NULL),
(14, 1, 'ORD-2026-00014', 15, NULL, 14, '2026-10-14 00:00:00.000', 'Morals city', NULL, NULL, 8500.00, 4000.00, 4500.00, NULL, NULL, 'YET_TO_START', '2026-10-12 15:12:22.454', '2026-10-12 15:12:22.470', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_documents`
--

CREATE TABLE `order_documents` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `document_type` enum('QUOTATION_PDF','RECEIPT','AGREEMENT','EVENT_PHOTO','OTHER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_by_id` int DEFAULT NULL,
  `uploaded_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_tasks`
--

CREATE TABLE `order_tasks` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `task_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_category` enum('PLANNING','EXECUTION') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_to_id` int DEFAULT NULL,
  `due_date` datetime(3) DEFAULT NULL,
  `completed_date` datetime(3) DEFAULT NULL,
  `completed_by_id` int DEFAULT NULL,
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','SKIPPED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `payment_date` datetime(3) NOT NULL,
  `payment_type` enum('ADVANCE','PARTIAL','FINAL') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('CASH','UPI','BANK','CARD','CHEQUE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `received_by_id` int DEFAULT NULL,
  `receipt_number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `payment_date`, `payment_type`, `amount`, `payment_method`, `reference_number`, `remarks`, `received_by_id`, `receipt_number`, `created_at`, `deleted_at`) VALUES
(1, 1, '2026-10-06 08:10:56.268', 'ADVANCE', 60000.00, 'CASH', NULL, 'Advance recorded on enquiry \"ENQ-2026-00002\".', 2, 'RCT-2026-00001', '2026-10-06 08:10:56.269', NULL),
(2, 2, '2026-10-06 10:12:20.930', 'ADVANCE', 5000.00, 'CASH', NULL, 'Advance recorded on enquiry \"ENQ-2026-00003\".', 2, 'RCT-2026-00002', '2026-10-06 10:12:20.932', NULL),
(3, 3, '2026-10-11 05:58:10.577', 'ADVANCE', 10000.00, 'CASH', NULL, 'Advance recorded on enquiry \"ENQ-2026-00004\".', 2, 'RCT-2026-00003', '2026-10-11 05:58:10.579', NULL),
(4, 5, '2026-10-11 06:57:59.014', 'ADVANCE', 1000.00, 'CASH', NULL, 'Advance recorded on enquiry \"ENQ-2026-00006\".', 2, 'RCT-2026-00004', '2026-10-11 06:57:59.015', NULL),
(5, 6, '2026-10-11 07:19:49.746', 'ADVANCE', 18000.00, 'CASH', NULL, 'Advance recorded on enquiry \"ENQ-2026-00007\".', 2, 'RCT-2026-00005', '2026-10-11 07:19:49.747', NULL),
(6, 8, '2026-10-11 09:51:02.793', 'ADVANCE', 1500.00, 'CASH', NULL, 'Advance recorded on enquiry \"ENQ-2026-00009\".', 2, 'RCT-2026-00006', '2026-10-11 09:51:02.795', NULL),
(7, 9, '2026-10-12 05:33:45.868', 'ADVANCE', 5000.00, 'CASH', NULL, 'Advance recorded on enquiry \"ENQ-2026-00010\".', 2, 'RCT-2026-00007', '2026-10-12 05:33:45.869', NULL),
(8, 10, '2026-10-12 11:23:32.590', 'ADVANCE', 1000.00, 'CASH', NULL, 'Advance recorded on enquiry \"ENQ-2026-00011\".', 2, 'RCT-2026-00008', '2026-10-12 11:23:32.592', NULL),
(9, 11, '2026-10-12 11:46:01.005', 'ADVANCE', 20000.00, 'CASH', NULL, 'Advance recorded on enquiry \"ENQ-2026-00012\".', 2, 'RCT-2026-00009', '2026-10-12 11:46:01.006', NULL),
(10, 13, '2026-10-12 12:20:16.532', 'ADVANCE', 5000.00, 'CASH', NULL, 'Advance recorded on enquiry \"ENQ-2026-00014\".', 2, 'RCT-2026-00010', '2026-10-12 12:20:16.534', NULL),
(11, 14, '2026-10-12 15:12:22.476', 'ADVANCE', 4000.00, 'CASH', NULL, 'Advance recorded on enquiry \"ENQ-2026-00015\".', 2, 'RCT-2026-00011', '2026-10-12 15:12:22.478', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `payment_trackers`
--

CREATE TABLE `payment_trackers` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `payment_status` enum('PENDING','ADVANCE_PAID','PARTIAL_PAYMENT','FULLY_PAID') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `status_manual` tinyint(1) NOT NULL DEFAULT '0',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_trackers`
--

INSERT INTO `payment_trackers` (`id`, `order_id`, `payment_status`, `status_manual`, `remarks`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'ADVANCE_PAID', 1, NULL, '2026-10-06 08:10:56.257', '2026-10-11 05:23:46.663', NULL),
(2, 2, 'ADVANCE_PAID', 0, NULL, '2026-10-06 10:12:20.918', '2026-10-06 10:12:20.942', NULL),
(3, 3, 'ADVANCE_PAID', 0, NULL, '2026-10-11 05:58:10.569', '2026-10-11 05:58:10.585', NULL),
(4, 4, 'PENDING', 0, NULL, '2026-10-11 06:34:12.214', '2026-10-11 06:34:12.214', NULL),
(5, 5, 'ADVANCE_PAID', 0, NULL, '2026-10-11 06:57:59.007', '2026-10-11 06:57:59.019', NULL),
(6, 6, 'FULLY_PAID', 0, NULL, '2026-10-11 07:19:49.740', '2026-10-11 07:19:49.751', NULL),
(7, 7, 'PENDING', 0, NULL, '2026-10-11 07:59:30.656', '2026-10-11 07:59:30.656', NULL),
(8, 8, 'ADVANCE_PAID', 0, NULL, '2026-10-11 09:51:02.772', '2026-10-11 09:51:02.806', NULL),
(9, 9, 'ADVANCE_PAID', 0, NULL, '2026-10-12 05:33:45.858', '2026-10-12 05:33:45.878', NULL),
(10, 10, 'ADVANCE_PAID', 0, NULL, '2026-10-12 11:23:32.576', '2026-10-12 11:23:32.605', NULL),
(11, 11, 'ADVANCE_PAID', 0, NULL, '2026-10-12 11:46:00.995', '2026-10-12 11:46:01.021', NULL),
(12, 12, 'PENDING', 0, NULL, '2026-10-12 12:06:58.233', '2026-10-12 12:06:58.233', NULL),
(13, 13, 'ADVANCE_PAID', 0, NULL, '2026-10-12 12:20:16.520', '2026-10-12 12:20:16.542', NULL),
(14, 14, 'ADVANCE_PAID', 0, NULL, '2026-10-12 15:12:22.468', '2026-10-12 15:12:22.486', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `quotations`
--

CREATE TABLE `quotations` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `source` enum('ENQUIRY','CUSTOMER','ORDER','MANUAL') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ENQUIRY',
  `enquiry_id` int DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `manual_customer_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manual_phone` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manual_whatsapp` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manual_email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manual_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `manual_gst` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quotation_number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` int NOT NULL DEFAULT '1',
  `quotation_date` datetime(3) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `discount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `cgst_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `sgst_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `tax` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL,
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('DRAFT','SENT','APPROVED','REJECTED','REVISED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `pdf_path` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_id` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quotations`
--

INSERT INTO `quotations` (`id`, `company_id`, `source`, `enquiry_id`, `customer_id`, `order_id`, `manual_customer_name`, `manual_phone`, `manual_whatsapp`, `manual_email`, `manual_address`, `manual_gst`, `quotation_number`, `version`, `quotation_date`, `subtotal`, `discount`, `cgst_percent`, `sgst_percent`, `tax`, `total_amount`, `remarks`, `status`, `pdf_path`, `created_by_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'ENQUIRY', 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'QTN-2026-00001', 1, '2026-10-07 00:00:00.000', 100000.00, 0.00, 0.00, 0.00, 0.00, 100000.00, NULL, 'DRAFT', 'quotations/1.pdf', 2, '2026-10-06 08:10:56.419', '2026-10-06 08:31:42.332', NULL),
(2, 1, 'ENQUIRY', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'QTN-2026-00002', 1, '2026-10-06 10:12:21.075', 47000.00, 0.00, 0.00, 0.00, 0.00, 47000.00, NULL, 'DRAFT', 'quotations/2.pdf', 2, '2026-10-06 10:12:21.077', '2026-10-06 10:12:21.132', NULL),
(3, 1, 'MANUAL', NULL, NULL, NULL, 'Dr.padmapriya', '98945 82474 ', '98945 82474 ', NULL, NULL, NULL, 'QTN-2026-00003', 1, '2026-10-06 00:00:00.000', 338200.00, 0.00, 0.00, 0.00, 0.00, 338200.00, NULL, 'APPROVED', 'quotations/3.pdf', 2, '2026-10-06 12:06:02.299', '2026-10-06 12:06:02.534', NULL),
(4, 1, 'ENQUIRY', 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'QTN-2026-00004', 1, '2026-10-12 00:00:00.000', 30000.00, 0.00, 0.00, 0.00, 0.00, 30000.00, NULL, 'APPROVED', 'quotations/4.pdf', 2, '2026-10-11 05:56:21.728', '2026-10-11 06:09:26.107', NULL),
(5, 1, 'ENQUIRY', 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'QTN-2026-00005', 1, '2026-10-11 06:34:12.298', 10000.00, 0.00, 0.00, 0.00, 0.00, 10000.00, NULL, 'DRAFT', 'quotations/5.pdf', 2, '2026-10-11 06:34:12.299', '2026-10-11 06:34:12.336', NULL),
(6, 1, 'ENQUIRY', 6, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'QTN-2026-00006', 1, '2026-10-11 00:00:00.000', 10000.00, 0.00, 0.00, 0.00, 0.00, 10000.00, NULL, 'DRAFT', 'quotations/6.pdf', 2, '2026-10-11 06:57:59.108', '2026-10-11 07:00:45.836', NULL),
(7, 1, 'ENQUIRY', 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'QTN-2026-00007', 1, '2026-10-11 00:00:00.000', 18000.00, 0.00, 0.00, 0.00, 0.00, 18000.00, NULL, 'DRAFT', 'quotations/7.pdf', 2, '2026-10-11 07:19:49.846', '2026-10-11 07:45:00.615', NULL),
(8, 1, 'ENQUIRY', 8, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'QTN-2026-00008', 1, '2026-10-11 00:00:00.000', 20200.00, 0.00, 0.00, 0.00, 0.00, 20200.00, NULL, 'DRAFT', 'quotations/8.pdf', 2, '2026-10-11 07:59:30.745', '2026-10-11 07:59:56.845', NULL),
(9, 1, 'ENQUIRY', 9, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'QTN-2026-00009', 1, '2026-10-11 00:00:00.000', 7500.00, 0.00, 0.00, 0.00, 0.00, 7500.00, NULL, 'DRAFT', 'quotations/9.pdf', 2, '2026-10-11 09:51:02.947', '2026-10-11 11:02:07.207', NULL),
(10, 1, 'ENQUIRY', 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'QTN-2026-00010', 1, '2026-10-12 00:00:00.000', 82500.00, 0.00, 0.00, 0.00, 0.00, 82500.00, NULL, 'DRAFT', 'quotations/10.pdf', 2, '2026-10-12 05:33:45.989', '2026-10-12 05:38:54.673', NULL),
(11, 1, 'ENQUIRY', 11, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'QTN-2026-00011', 1, '2026-10-12 00:00:00.000', 18000.00, 0.00, 0.00, 0.00, 0.00, 18000.00, NULL, 'DRAFT', 'quotations/11.pdf', 2, '2026-10-12 11:22:41.395', '2026-10-12 11:26:13.081', NULL),
(12, 1, 'ENQUIRY', 12, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'QTN-2026-00012', 1, '2026-10-12 00:00:00.000', 40000.00, 0.00, 0.00, 0.00, 0.00, 40000.00, NULL, 'DRAFT', 'quotations/12.pdf', 2, '2026-10-12 11:46:01.193', '2026-10-12 11:54:46.403', NULL),
(13, 1, 'ENQUIRY', 13, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'QTN-2026-00013', 1, '2026-10-12 00:00:00.000', 34140.00, 0.00, 0.00, 0.00, 0.00, 34140.00, NULL, 'DRAFT', 'quotations/13.pdf', 2, '2026-10-12 12:06:58.367', '2026-10-12 12:09:55.965', NULL),
(14, 1, 'ENQUIRY', 14, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'QTN-2026-00014', 1, '2026-10-12 00:00:00.000', 10000.00, 0.00, 0.00, 0.00, 0.00, 10000.00, NULL, 'DRAFT', 'quotations/14.pdf', 2, '2026-10-12 12:20:16.714', '2026-10-12 12:21:34.416', NULL),
(15, 1, 'ENQUIRY', 15, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'QTN-2026-00015', 1, '2026-10-12 15:12:22.734', 8500.00, 0.00, 0.00, 0.00, 0.00, 8500.00, NULL, 'DRAFT', 'quotations/15.pdf', 2, '2026-10-12 15:12:22.736', '2026-10-12 15:12:22.804', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `quotation_images`
--

CREATE TABLE `quotation_images` (
  `id` int NOT NULL,
  `quotation_id` int NOT NULL,
  `file_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quotation_images`
--

INSERT INTO `quotation_images` (`id`, `quotation_id`, `file_name`, `file_path`, `caption`, `sort_order`, `created_at`, `deleted_at`) VALUES
(1, 4, 'JAILCORNER IMG.jpeg', 'quotation-images/1791698955087-674864593.jpeg', NULL, 0, '2026-10-11 06:09:15.360', NULL),
(2, 6, 'NIKKIETHA IMG.jpeg', 'quotation-images/1791702041239-940408587.jpeg', NULL, 0, '2026-10-11 07:00:41.622', NULL),
(3, 7, 'WhatsApp Image 2026-10-10 at 3.10.50 PM.jpeg', 'quotation-images/1791703867144-252527134.jpeg', NULL, 0, '2026-10-11 07:31:07.340', '2026-10-11 07:31:11.054'),
(4, 7, 'HEMMINGER IMAGE.jpeg', 'quotation-images/1791704513743-509955309.jpeg', NULL, 0, '2026-10-11 07:41:54.023', NULL),
(5, 7, 'HEMMINGER IMAGE -01.jpeg', 'quotation-images/1791704695055-928700909.jpeg', NULL, 1, '2026-10-11 07:44:55.662', NULL),
(6, 9, 'SUMANGALI IMG.jpeg', 'quotation-images/1791716521986-617317948.jpeg', NULL, 0, '2026-10-11 11:02:02.393', NULL),
(7, 10, 'balaji mahal img1.jpeg', 'quotation-images/1791783367599-219907363.jpeg', NULL, 0, '2026-10-12 05:36:07.933', NULL),
(8, 10, 'balaji mahal img2.jpeg', 'quotation-images/1791783373577-59813564.jpeg', NULL, 1, '2026-10-12 05:36:13.670', NULL),
(9, 10, 'balaji mahal img3.jpeg', 'quotation-images/1791783379918-710434821.jpeg', NULL, 2, '2026-10-12 05:36:20.072', NULL),
(10, 11, 'HOTEL KANNAPPA IMG1.jpeg', 'quotation-images/1791804362923-761495828.jpeg', NULL, 0, '2026-10-12 11:26:03.408', NULL),
(11, 11, 'HOTEL KANNAPPA IMG2.jpeg', 'quotation-images/1791804369631-382966753.jpeg', NULL, 1, '2026-10-12 11:26:09.821', NULL),
(12, 12, 'SRI AMMAN MAHAL IMG.jpeg', 'quotation-images/1791806083491-693095474.jpeg', NULL, 0, '2026-10-12 11:54:43.821', NULL),
(13, 14, 'AADHAV ILAMARAN IMG.jpeg', 'quotation-images/1791807689477-741623515.jpeg', NULL, 0, '2026-10-12 12:21:31.781', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `quotation_items`
--

CREATE TABLE `quotation_items` (
  `id` int NOT NULL,
  `quotation_id` int NOT NULL,
  `item_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rate` decimal(12,2) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quotation_items`
--

INSERT INTO `quotation_items` (`id`, `quotation_id`, `item_name`, `description`, `quantity`, `unit`, `rate`, `amount`, `sort_order`) VALUES
(47, 1, 'BACK DROP SANDIL CLOTH', NULL, 1.00, NULL, 100000.00, 100000.00, 0),
(48, 1, 'CENTER FLOWER BOARD -WHITE', NULL, 1.00, NULL, 0.00, 0.00, 1),
(49, 1, 'RED TOUCH UP', NULL, 1.00, NULL, 0.00, 0.00, 2),
(50, 1, 'CHANLIEAR LIGHT', NULL, 10.00, NULL, 0.00, 0.00, 3),
(51, 1, 'TOP CLOTH WORK', NULL, 1.00, NULL, 0.00, 0.00, 4),
(52, 1, 'FRONT NETHI POO', NULL, 1.00, NULL, 0.00, 0.00, 5),
(53, 1, 'FRONT RUNNING GARDEN', NULL, 1.00, NULL, 0.00, 0.00, 6),
(54, 1, 'STAGE MAT SANDIL', NULL, 1.00, NULL, 0.00, 0.00, 7),
(55, 1, 'PROPS-BRASS', NULL, 1.00, NULL, 0.00, 0.00, 8),
(56, 1, 'FRONT FRILL', NULL, 1.00, NULL, 0.00, 0.00, 9),
(57, 1, 'SOFA', NULL, 1.00, NULL, 0.00, 0.00, 10),
(58, 1, 'FOCUS', NULL, 1.00, NULL, 0.00, 0.00, 11),
(59, 1, 'PATHWAY MAT', NULL, 1.00, NULL, 0.00, 0.00, 12),
(60, 1, 'DOOR ENTRANCE', NULL, 1.00, NULL, 0.00, 0.00, 13),
(61, 1, 'RECEPTION AREA BACKGROUND', NULL, 1.00, NULL, 0.00, 0.00, 14),
(62, 1, 'RAMP-20FT', NULL, 1.00, NULL, 0.00, 0.00, 15),
(63, 1, 'TABLE CLOTH SET', NULL, 1.00, NULL, 0.00, 0.00, 16),
(64, 1, 'ENTRANCE 3 STEP ARCH', NULL, 1.00, NULL, 0.00, 0.00, 17),
(65, 1, 'OUTSIDE 8X8 NAME BOARD', NULL, 1.00, NULL, 0.00, 0.00, 18),
(66, 1, 'LOGO', NULL, 1.00, NULL, 0.00, 0.00, 19),
(67, 1, 'AK STAND 3X2', NULL, 1.00, NULL, 0.00, 0.00, 20),
(68, 1, 'ADDITIONAL BOUQUE', NULL, 1.00, NULL, 0.00, 0.00, 21),
(69, 1, 'CAR DECORATION', NULL, 1.00, NULL, 0.00, 0.00, 22),
(70, 2, 'VIP SOFA', NULL, 22.00, NULL, 1000.00, 22000.00, 0),
(71, 2, 'D.CHAIR', NULL, 1200.00, NULL, 10.00, 12000.00, 1),
(72, 2, 'WASHBASIN', NULL, 2.00, NULL, 1000.00, 2000.00, 2),
(73, 2, 'S.TABLE', NULL, 75.00, NULL, 40.00, 3000.00, 3),
(74, 2, 'TRANSPORT', NULL, 1.00, NULL, 8000.00, 8000.00, 4),
(75, 3, 'Arabian tent + lighting', NULL, 4.00, NULL, 0.00, 0.00, 0),
(76, 3, 'Carpet 40x40', NULL, 1.00, NULL, 338200.00, 338200.00, 1),
(77, 3, 'Pathway carpet', NULL, 1.00, NULL, 0.00, 0.00, 2),
(78, 3, 'Stage 8x16', NULL, 1.00, NULL, 0.00, 0.00, 3),
(79, 3, 'Staircase 3x16', NULL, 1.00, NULL, 0.00, 0.00, 4),
(80, 3, 'Staircase 2x16', NULL, 1.00, NULL, 0.00, 0.00, 5),
(81, 3, 'Staircase 1x16', NULL, 1.00, NULL, 0.00, 0.00, 6),
(82, 3, 'Serial', NULL, 300.00, NULL, 0.00, 0.00, 7),
(83, 3, 'Focus', NULL, 20.00, NULL, 0.00, 0.00, 8),
(84, 3, 'S.table with cover', NULL, 12.00, NULL, 0.00, 0.00, 9),
(85, 3, 'D.chair with cover', NULL, 148.00, NULL, 0.00, 0.00, 10),
(86, 3, 'Fan', NULL, 10.00, NULL, 0.00, 0.00, 11),
(87, 3, 'Air cooler big size', NULL, 2.00, NULL, 0.00, 0.00, 12),
(88, 3, 'Stage decoration', NULL, 1.00, NULL, 0.00, 0.00, 13),
(89, 3, 'Hand cart', NULL, 1.00, NULL, 0.00, 0.00, 14),
(90, 3, 'Water gun, standing board', NULL, 1.00, NULL, 0.00, 0.00, 15),
(91, 3, 'Acrylic name board with banana leaf', NULL, 1.00, NULL, 0.00, 0.00, 16),
(92, 3, 'Bangle board + stand', NULL, 1.00, NULL, 0.00, 0.00, 17),
(93, 3, 'Earring board + stand', NULL, 1.00, NULL, 0.00, 0.00, 18),
(118, 4, 'Backdrop white with serial', NULL, 1.00, NULL, 30000.00, 30000.00, 0),
(119, 4, 'Green leaf border', NULL, 1.00, NULL, 0.00, 0.00, 1),
(120, 4, 'Scalp with white cloth', NULL, 1.00, NULL, 0.00, 0.00, 2),
(121, 4, 'Side kerala stand scalp work', NULL, 1.00, NULL, 0.00, 0.00, 3),
(122, 4, 'Aadi round flower work', NULL, 1.00, NULL, 0.00, 0.00, 4),
(123, 4, 'Sofa', NULL, 1.00, NULL, 0.00, 0.00, 5),
(124, 4, 'Focus', NULL, 5.00, NULL, 0.00, 0.00, 6),
(125, 4, 'Flower pot', NULL, 8.00, NULL, 0.00, 0.00, 7),
(126, 4, 'Stage mat -ash', NULL, 1.00, NULL, 0.00, 0.00, 8),
(127, 4, 'Front frill', NULL, 1.00, NULL, 0.00, 0.00, 9),
(128, 4, 'Front bunch garden', NULL, 1.00, NULL, 0.00, 0.00, 10),
(129, 4, 'Logo-AL', NULL, 1.00, NULL, 0.00, 0.00, 11),
(130, 5, 'Back drop 8x5 flex', NULL, 1.00, NULL, 10000.00, 10000.00, 0),
(131, 5, 'Stage as per-o.g', NULL, 1.00, NULL, 0.00, 0.00, 1),
(132, 5, 'Sofa', NULL, 1.00, NULL, 0.00, 0.00, 2),
(133, 5, 'Uruli', NULL, 1.00, NULL, 0.00, 0.00, 3),
(134, 5, 'Stool', NULL, 1.00, NULL, 0.00, 0.00, 4),
(135, 5, 'Stage mat', NULL, 1.00, NULL, 0.00, 0.00, 5),
(136, 5, 'Focus', NULL, 1.00, NULL, 0.00, 0.00, 6),
(137, 5, 'Bross-props', NULL, 1.00, NULL, 0.00, 0.00, 7),
(148, 6, 'Back drop flex', NULL, 1.00, NULL, 10000.00, 10000.00, 0),
(149, 6, 'A.f maalai work', NULL, 1.00, NULL, 0.00, 0.00, 1),
(150, 6, 'Props', NULL, 4.00, NULL, 0.00, 0.00, 2),
(151, 6, 'Stage mat', NULL, 1.00, NULL, 0.00, 0.00, 3),
(152, 6, 'Front frill', NULL, 1.00, NULL, 0.00, 0.00, 4),
(153, 6, 'Front bunch garden', NULL, 1.00, NULL, 0.00, 0.00, 5),
(154, 6, 'Focus', NULL, 4.00, NULL, 0.00, 0.00, 6),
(155, 6, 'Sofa', NULL, 1.00, NULL, 0.00, 0.00, 7),
(156, 6, 'Center nethi poo', NULL, 1.00, NULL, 0.00, 0.00, 8),
(157, 6, 'Letter', NULL, 1.00, NULL, 0.00, 0.00, 9),
(168, 7, 'Garden area serial', NULL, 1.00, NULL, 18000.00, 18000.00, 0),
(169, 7, 'Swimming pool serial', NULL, 1.00, NULL, 0.00, 0.00, 1),
(170, 7, 'Remo - 30 FT', NULL, 1.00, NULL, 0.00, 0.00, 2),
(171, 7, 'Stage flex 1 - 10 *8', NULL, 1.00, NULL, 0.00, 0.00, 3),
(172, 7, 'Stage flex 2 - 8*8', NULL, 1.00, NULL, 0.00, 0.00, 4),
(173, 7, 'Stage mat', NULL, 1.00, NULL, 0.00, 0.00, 5),
(174, 7, 'Focus', NULL, 5.00, NULL, 0.00, 0.00, 6),
(175, 7, 'Front frill', NULL, 1.00, NULL, 0.00, 0.00, 7),
(176, 7, 'Pathway mat - 55 FT', NULL, 1.00, NULL, 0.00, 0.00, 8),
(177, 7, 'Transport', NULL, 1.00, NULL, 0.00, 0.00, 9),
(183, 8, 'S.table + cloth', NULL, 15.00, NULL, 120.00, 1800.00, 0),
(184, 8, 'D.chair+ cover', NULL, 70.00, NULL, 50.00, 3500.00, 1),
(185, 8, 'Panthal  - 20 *60', NULL, 1200.00, NULL, 7.00, 8400.00, 2),
(186, 8, 'Floor mat', NULL, 1200.00, NULL, 5.00, 6000.00, 3),
(187, 8, 'Transport', NULL, 1.00, NULL, 500.00, 500.00, 4),
(212, 9, 'Backdrop white with serial', NULL, 1.00, NULL, 7500.00, 7500.00, 0),
(213, 9, 'Green leaf border', NULL, 1.00, NULL, 0.00, 0.00, 1),
(214, 9, 'Ring with holder bulb', NULL, 6.00, NULL, 0.00, 0.00, 2),
(215, 9, 'Rekka stand', NULL, 2.00, NULL, 0.00, 0.00, 3),
(216, 9, 'Minimun bouquet', NULL, 6.00, NULL, 0.00, 0.00, 4),
(217, 9, 'Flower pot', NULL, 2.00, NULL, 0.00, 0.00, 5),
(218, 9, 'Focus', NULL, 6.00, NULL, 0.00, 0.00, 6),
(219, 9, 'Sofa', NULL, 1.00, NULL, 0.00, 0.00, 7),
(220, 9, 'Stage mat -ash', NULL, 1.00, NULL, 0.00, 0.00, 8),
(221, 9, 'Front frill', NULL, 1.00, NULL, 0.00, 0.00, 9),
(222, 9, 'Front bunch garden', NULL, 1.00, NULL, 0.00, 0.00, 10),
(223, 9, 'Letter stage', NULL, 1.00, NULL, 0.00, 0.00, 11),
(290, 10, 'Back drop white', NULL, 1.00, NULL, 75000.00, 75000.00, 0),
(291, 10, 'Stick light', NULL, 2.00, NULL, 0.00, 0.00, 1),
(292, 10, 'Scalp white cloth', NULL, 1.00, NULL, 0.00, 0.00, 2),
(293, 10, 'Top arkit hangings', NULL, 1.00, NULL, 0.00, 0.00, 3),
(294, 10, 'Lollypop hangings', NULL, 1.00, NULL, 0.00, 0.00, 4),
(295, 10, 'Top nethi poo Mixed flower', NULL, 1.00, NULL, 0.00, 0.00, 5),
(296, 10, 'Chanliear light', NULL, 6.00, NULL, 0.00, 0.00, 6),
(297, 10, 'Aircooler', NULL, 2.00, NULL, 0.00, 0.00, 7),
(298, 10, 'sofa', NULL, 1.00, NULL, 0.00, 0.00, 8),
(299, 10, 'Sofa setup', NULL, 1.00, NULL, 0.00, 0.00, 9),
(300, 10, 'Focus', NULL, 8.00, NULL, 0.00, 0.00, 10),
(301, 10, 'Flower pot', NULL, 4.00, NULL, 0.00, 0.00, 11),
(302, 10, 'Stage mat-sandil printed', NULL, 1.00, NULL, 0.00, 0.00, 12),
(303, 10, 'Front frill', NULL, 1.00, NULL, 0.00, 0.00, 13),
(304, 10, 'Front running garden', NULL, 1.00, NULL, 0.00, 0.00, 14),
(305, 10, 'Box type Door entrance', NULL, 1.00, NULL, 0.00, 0.00, 15),
(306, 10, 'Chanliear light', NULL, 1.00, NULL, 0.00, 0.00, 16),
(307, 10, 'Scalap lavender cloth work', NULL, 1.00, NULL, 0.00, 0.00, 17),
(308, 10, 'Flower work a.f as per', NULL, 1.00, NULL, 0.00, 0.00, 18),
(309, 10, 'Side name board -3x2', NULL, 1.00, NULL, 0.00, 0.00, 19),
(310, 10, 'Flower work as per', NULL, 1.00, NULL, 0.00, 0.00, 20),
(311, 10, 'Kili koondu', NULL, 2.00, NULL, 0.00, 0.00, 21),
(312, 10, 'Brass Kuduvai', NULL, 2.00, NULL, 0.00, 0.00, 22),
(313, 10, 'Butterfly neyon light', NULL, 1.00, NULL, 0.00, 0.00, 23),
(314, 10, 'Selfi booth', NULL, 1.00, NULL, 7500.00, 7500.00, 24),
(315, 10, 'arch frame-8x5', NULL, 1.00, NULL, 0.00, 0.00, 25),
(316, 10, 'Flower work a.f as per', NULL, 1.00, NULL, 0.00, 0.00, 26),
(317, 10, 'Better together neyon light', NULL, 1.00, NULL, 0.00, 0.00, 27),
(318, 10, 'Focus', NULL, 4.00, NULL, 0.00, 0.00, 28),
(319, 10, 'Pathway mat', NULL, 1.00, NULL, 0.00, 0.00, 29),
(320, 10, 'Reception table cloth', NULL, 1.00, NULL, 0.00, 0.00, 30),
(321, 10, 'Outside name board-8x8', NULL, 1.00, NULL, 0.00, 0.00, 31),
(322, 10, 'logo', NULL, 1.00, NULL, 0.00, 0.00, 32),
(335, 11, 'Backdrop white with serial', NULL, 1.00, NULL, 18000.00, 18000.00, 0),
(336, 11, 'Scalp work white & blue cloth', NULL, 1.00, NULL, 0.00, 0.00, 1),
(337, 11, 'Stick light', NULL, 2.00, NULL, 0.00, 0.00, 2),
(338, 11, 'Half round with neyon light flower work', NULL, 1.00, NULL, 0.00, 0.00, 3),
(339, 11, 'Sofa + pillows', NULL, 1.00, NULL, 0.00, 0.00, 4),
(340, 11, 'Stage mat - sandil', NULL, 1.00, NULL, 0.00, 0.00, 5),
(341, 11, 'Focus', NULL, 5.00, NULL, 0.00, 0.00, 6),
(342, 11, 'Minimum bouquet', NULL, 1.00, NULL, 0.00, 0.00, 7),
(343, 11, 'Front frill', NULL, 1.00, NULL, 0.00, 0.00, 8),
(344, 11, 'Front running garden', NULL, 1.00, NULL, 0.00, 0.00, 9),
(345, 11, 'Ak stand', NULL, 1.00, NULL, 0.00, 0.00, 10),
(346, 11, 'Candle light', NULL, 2.00, NULL, 0.00, 0.00, 11),
(362, 12, 'Backdrop white', NULL, 1.00, NULL, 40000.00, 40000.00, 0),
(363, 12, 'Green leaf border', NULL, 1.00, NULL, 0.00, 0.00, 1),
(364, 12, 'Half round - (A.f) white, pink, peach', NULL, 1.00, NULL, 0.00, 0.00, 2),
(365, 12, 'Holder bulb', NULL, 1.00, NULL, 0.00, 0.00, 3),
(366, 12, 'Ring with bulb', NULL, 4.00, NULL, 0.00, 0.00, 4),
(367, 12, 'Flower pot', NULL, 4.00, NULL, 0.00, 0.00, 5),
(368, 12, 'Focus', NULL, 5.00, NULL, 0.00, 0.00, 6),
(369, 12, 'Manavarai Sofa', NULL, 1.00, NULL, 0.00, 0.00, 7),
(370, 12, 'Stage mat - sandil printed', NULL, 1.00, NULL, 0.00, 0.00, 8),
(371, 12, 'Front frill', NULL, 1.00, NULL, 0.00, 0.00, 9),
(372, 12, 'Front running garden', NULL, 1.00, NULL, 0.00, 0.00, 10),
(373, 12, 'Pathway mat', NULL, 2.00, NULL, 0.00, 0.00, 11),
(374, 12, 'Door entrance', NULL, 1.00, NULL, 0.00, 0.00, 12),
(375, 12, 'Morais city arch', NULL, 1.00, NULL, 0.00, 0.00, 13),
(376, 12, 'Name board-8X8', NULL, 1.00, NULL, 0.00, 0.00, 14),
(387, 13, 'Selfibooth', NULL, 1.00, NULL, 7000.00, 7000.00, 0),
(388, 13, 'Balloon arch (orange,white,green)', NULL, 1.00, NULL, 2500.00, 2500.00, 1),
(389, 13, 'Panthal -30X80', NULL, 1.00, NULL, 16800.00, 16800.00, 2),
(390, 13, 'Frill sandil', NULL, 1.00, NULL, 1500.00, 1500.00, 3),
(391, 13, 'Podium + flower work', NULL, 1.00, NULL, 1500.00, 1500.00, 4),
(392, 13, 'Washbasin', NULL, 1.00, NULL, 1000.00, 1000.00, 5),
(393, 13, 'S.table', NULL, 12.00, NULL, 40.00, 480.00, 6),
(394, 13, 'S.table cloth', NULL, 12.00, NULL, 80.00, 960.00, 7),
(395, 13, '2 flex work +podium flower work', NULL, 1.00, NULL, 1400.00, 1400.00, 8),
(396, 13, 'Transport', NULL, 1.00, NULL, 1000.00, 1000.00, 9),
(405, 14, 'Backdrop white with serial', NULL, 1.00, NULL, 10000.00, 10000.00, 0),
(406, 14, 'Green scalp cloth work', NULL, 1.00, NULL, 0.00, 0.00, 1),
(407, 14, 'Balloon round- dark& light green, white,silver', NULL, 1.00, NULL, 0.00, 0.00, 2),
(408, 14, 'Drum', NULL, 3.00, NULL, 0.00, 0.00, 3),
(409, 14, 'Happy birthday- light', NULL, 1.00, NULL, 0.00, 0.00, 4),
(410, 14, '1st  - light', NULL, 1.00, NULL, 0.00, 0.00, 5),
(411, 14, 'Silver table', NULL, 4.00, NULL, 0.00, 0.00, 6),
(412, 14, 'D.chair', NULL, 30.00, NULL, 0.00, 0.00, 7),
(413, 15, 'White White with serial backdrop', NULL, 1.00, NULL, 8500.00, 8500.00, 0),
(414, 15, 'Sofa', NULL, 1.00, NULL, 0.00, 0.00, 1),
(415, 15, 'Focus -4', NULL, 1.00, NULL, 0.00, 0.00, 2),
(416, 15, 'Stage mat', NULL, 1.00, NULL, 0.00, 0.00, 3),
(417, 15, 'Front frill', NULL, 1.00, NULL, 0.00, 0.00, 4),
(418, 15, 'Front bunch garden', NULL, 1.00, NULL, 0.00, 0.00, 5),
(419, 15, 'Name board - thermocol', NULL, 1.00, NULL, 0.00, 0.00, 6),
(420, 15, 'Inside pathway mat', NULL, 1.00, NULL, 0.00, 0.00, 7);

-- --------------------------------------------------------

--
-- Table structure for table `rental_items`
--

CREATE TABLE `rental_items` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `item_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_rent_rate` decimal(12,2) DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('ACTIVE','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rental_persons`
--

CREATE TABLE `rental_persons` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `city` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('ACTIVE','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rent_payments`
--

CREATE TABLE `rent_payments` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `payment_no` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock_out_id` int NOT NULL,
  `rental_person_id` int NOT NULL,
  `payment_date` datetime(3) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_mode` enum('CASH','UPI','BANK_TRANSFER','CARD','OTHER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_no` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `received_by_id` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_outs`
--

CREATE TABLE `stock_outs` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `rent_no` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rental_person_id` int NOT NULL,
  `stock_out_date` datetime(3) NOT NULL,
  `expected_return_date` datetime(3) DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `additional_charges` decimal(12,2) NOT NULL DEFAULT '0.00',
  `grand_total` decimal(12,2) NOT NULL,
  `paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `issued_quantity` decimal(12,2) NOT NULL DEFAULT '0.00',
  `returned_quantity` decimal(12,2) NOT NULL DEFAULT '0.00',
  `return_status` enum('NOT_RETURNED','PARTIAL_RETURNED','RETURNED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NOT_RETURNED',
  `payment_status` enum('UNPAID','PARTIALLY_PAID','PAID') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNPAID',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('ACTIVE','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_by_id` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_out_items`
--

CREATE TABLE `stock_out_items` (
  `id` int NOT NULL,
  `stock_out_id` int NOT NULL,
  `rental_item_id` int DEFAULT NULL,
  `item_name_snapshot` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `rate` decimal(12,2) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `returned_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_returns`
--

CREATE TABLE `stock_returns` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `return_no` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock_out_id` int NOT NULL,
  `return_date` datetime(3) NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by_id` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_return_items`
--

CREATE TABLE `stock_return_items` (
  `id` int NOT NULL,
  `stock_return_id` int NOT NULL,
  `stock_out_item_id` int NOT NULL,
  `quantity_returned` decimal(10,2) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_groups`
--

CREATE TABLE `task_groups` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('DRAFT','PUBLISHED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PUBLISHED',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_items`
--

CREATE TABLE `task_items` (
  `id` int NOT NULL,
  `task_group_id` int NOT NULL,
  `task_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `photo_path` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `completed_at` datetime(3) DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_templates`
--

CREATE TABLE `task_templates` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `task_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_category` enum('PLANNING','EXECUTION') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EXECUTION',
  `display_order` int NOT NULL DEFAULT '0',
  `is_default` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `user_group_id` int NOT NULL,
  `employee_code` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_photo` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `company_id`, `user_group_id`, `employee_code`, `full_name`, `username`, `email`, `mobile`, `city`, `password_hash`, `profile_photo`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, NULL, 'Super Admin', 'admin', 'admin@sanju.local', '9999999999', NULL, '$2b$10$QbZ7CbHUBj1aGB1RxE/nGOIjBAw5mHNr6cewFwfCwM58ACkWMCW.K', NULL, 1, '2026-09-27 07:12:31.820', '2026-09-27 07:12:31.820', NULL),
(2, 1, 1, NULL, 'Infant raj', 'infant', NULL, '8754267943', 'Trichy', '$2b$10$fMv5vAjDLzFJawxFzdn5Meuc9SB0zFTPV9kkDVJV7V51dXRbFxE6u', NULL, 1, '2026-10-05 16:37:50.041', '2026-10-05 16:37:50.041', NULL),
(3, 1, 1, NULL, 'Manager', 'manager', NULL, '+91 93855 67943', 'Trichy', '$2b$10$E7/OV4mk0fQ9MDNQdaXcJu4Cmr1TxNM5ni7trHpwogHKIJCAtH7Aq', NULL, 1, '2026-10-06 07:23:17.914', '2026-10-06 07:23:17.914', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_groups`
--

CREATE TABLE `user_groups` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `group_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('ACTIVE','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_groups`
--

INSERT INTO `user_groups` (`id`, `company_id`, `group_name`, `description`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'Super Admin', NULL, 'ACTIVE', '2026-09-27 07:12:27.114', '2026-09-27 07:12:27.114', NULL),
(2, 1, 'Manager', NULL, 'ACTIVE', '2026-09-27 07:12:28.816', '2026-09-27 07:12:28.816', NULL),
(3, 1, 'Sales Executive', NULL, 'ACTIVE', '2026-09-27 07:12:29.780', '2026-09-27 07:12:29.780', NULL),
(4, 1, 'Event Coordinator', NULL, 'ACTIVE', '2026-09-27 07:12:30.294', '2026-09-27 07:12:30.294', NULL),
(5, 1, 'Accountant', NULL, 'ACTIVE', '2026-09-27 07:12:31.038', '2026-09-27 07:12:31.038', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_group_permissions`
--

CREATE TABLE `user_group_permissions` (
  `id` int NOT NULL,
  `user_group_id` int NOT NULL,
  `module` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_group_permissions`
--

INSERT INTO `user_group_permissions` (`id`, `user_group_id`, `module`, `action`, `created_at`) VALUES
(1, 1, 'DASHBOARD', 'canView', '2026-09-27 07:12:27.207'),
(2, 1, 'ENQUIRIES', 'canView', '2026-09-27 07:12:27.231'),
(3, 1, 'ENQUIRIES', 'canCreate', '2026-09-27 07:12:27.275'),
(4, 1, 'ENQUIRIES', 'canEdit', '2026-09-27 07:12:27.554'),
(5, 1, 'ENQUIRIES', 'canDelete', '2026-09-27 07:12:27.588'),
(6, 1, 'ENQUIRIES', 'canAssign', '2026-09-27 07:12:27.624'),
(7, 1, 'ENQUIRIES', 'canChangeStatus', '2026-09-27 07:12:27.640'),
(8, 1, 'ENQUIRIES', 'canConvertToOrder', '2026-09-27 07:12:27.683'),
(9, 1, 'ENQUIRIES', 'canExport', '2026-09-27 07:12:27.705'),
(10, 1, 'QUOTATIONS', 'canView', '2026-09-27 07:12:27.724'),
(11, 1, 'QUOTATIONS', 'canCreate', '2026-09-27 07:12:27.758'),
(12, 1, 'QUOTATIONS', 'canEdit', '2026-09-27 07:12:27.799'),
(13, 1, 'QUOTATIONS', 'canApprove', '2026-09-27 07:12:27.841'),
(14, 1, 'QUOTATIONS', 'canPrint', '2026-09-27 07:12:27.855'),
(15, 1, 'QUOTATIONS', 'canExport', '2026-09-27 07:12:27.874'),
(16, 1, 'ORDERS', 'canView', '2026-09-27 07:12:27.915'),
(17, 1, 'ORDERS', 'canCreate', '2026-09-27 07:12:27.930'),
(18, 1, 'ORDERS', 'canEdit', '2026-09-27 07:12:27.949'),
(19, 1, 'ORDERS', 'canCancel', '2026-09-27 07:12:27.963'),
(20, 1, 'ORDERS', 'canCompleteEvent', '2026-09-27 07:12:27.982'),
(21, 1, 'ORDERS', 'canExport', '2026-09-27 07:12:27.996'),
(22, 1, 'PLANNING', 'canView', '2026-09-27 07:12:28.015'),
(23, 1, 'PLANNING', 'canCreate', '2026-09-27 07:12:28.030'),
(24, 1, 'PLANNING', 'canEdit', '2026-09-27 07:12:28.049'),
(25, 1, 'PLANNING', 'canDelete', '2026-09-27 07:12:28.063'),
(26, 1, 'PLANNING', 'canUpdateChecklist', '2026-09-27 07:12:28.091'),
(27, 1, 'PAYMENTS', 'canView', '2026-09-27 07:12:28.105'),
(28, 1, 'PAYMENTS', 'canCreate', '2026-09-27 07:12:28.124'),
(29, 1, 'PAYMENTS', 'canEdit', '2026-09-27 07:12:28.138'),
(30, 1, 'PAYMENTS', 'canPrint', '2026-09-27 07:12:28.157'),
(31, 1, 'PAYMENTS', 'canExport', '2026-09-27 07:12:28.172'),
(32, 1, 'CUSTOMERS', 'canView', '2026-09-27 07:12:28.213'),
(33, 1, 'CUSTOMERS', 'canEdit', '2026-09-27 07:12:28.249'),
(34, 1, 'CUSTOMERS', 'canExport', '2026-09-27 07:12:28.263'),
(35, 1, 'CALENDAR', 'canView', '2026-09-27 07:12:28.283'),
(36, 1, 'RENT', 'canView', '2026-09-27 07:12:28.457'),
(37, 1, 'RENT', 'canCreate', '2026-09-27 07:12:28.488'),
(38, 1, 'RENT', 'canEdit', '2026-09-27 07:12:28.513'),
(39, 1, 'RENT', 'canDelete', '2026-09-27 07:12:28.532'),
(40, 1, 'RENT', 'canPrint', '2026-09-27 07:12:28.547'),
(41, 1, 'RENT', 'canExport', '2026-09-27 07:12:28.582'),
(42, 1, 'REPORTS', 'canView', '2026-09-27 07:12:28.596'),
(43, 1, 'REPORTS', 'canExport', '2026-09-27 07:12:28.615'),
(44, 1, 'MASTERS', 'canView', '2026-09-27 07:12:28.664'),
(45, 1, 'MASTERS', 'canCreate', '2026-09-27 07:12:28.713'),
(46, 1, 'MASTERS', 'canEdit', '2026-09-27 07:12:28.741'),
(47, 1, 'MASTERS', 'canDelete', '2026-09-27 07:12:28.763'),
(48, 1, 'SETTINGS', 'canView', '2026-09-27 07:12:28.782'),
(49, 1, 'SETTINGS', 'canEdit', '2026-09-27 07:12:28.796'),
(50, 2, 'DASHBOARD', 'canView', '2026-09-27 07:12:28.829'),
(51, 2, 'ENQUIRIES', 'canView', '2026-09-27 07:12:28.848'),
(52, 2, 'ENQUIRIES', 'canCreate', '2026-09-27 07:12:28.862'),
(53, 2, 'ENQUIRIES', 'canEdit', '2026-09-27 07:12:28.907'),
(54, 2, 'ENQUIRIES', 'canDelete', '2026-09-27 07:12:28.920'),
(55, 2, 'ENQUIRIES', 'canAssign', '2026-09-27 07:12:28.940'),
(56, 2, 'ENQUIRIES', 'canChangeStatus', '2026-09-27 07:12:28.954'),
(57, 2, 'ENQUIRIES', 'canConvertToOrder', '2026-09-27 07:12:28.973'),
(58, 2, 'ENQUIRIES', 'canExport', '2026-09-27 07:12:28.987'),
(59, 2, 'QUOTATIONS', 'canView', '2026-09-27 07:12:29.007'),
(60, 2, 'QUOTATIONS', 'canCreate', '2026-09-27 07:12:29.020'),
(61, 2, 'QUOTATIONS', 'canEdit', '2026-09-27 07:12:29.048'),
(62, 2, 'QUOTATIONS', 'canApprove', '2026-09-27 07:12:29.062'),
(63, 2, 'QUOTATIONS', 'canPrint', '2026-09-27 07:12:29.082'),
(64, 2, 'QUOTATIONS', 'canExport', '2026-09-27 07:12:29.095'),
(65, 2, 'ORDERS', 'canView', '2026-09-27 07:12:29.115'),
(66, 2, 'ORDERS', 'canCreate', '2026-09-27 07:12:29.129'),
(67, 2, 'ORDERS', 'canEdit', '2026-09-27 07:12:29.148'),
(68, 2, 'ORDERS', 'canCancel', '2026-09-27 07:12:29.162'),
(69, 2, 'ORDERS', 'canCompleteEvent', '2026-09-27 07:12:29.181'),
(70, 2, 'ORDERS', 'canExport', '2026-09-27 07:12:29.195'),
(71, 2, 'PLANNING', 'canView', '2026-09-27 07:12:29.220'),
(72, 2, 'PLANNING', 'canCreate', '2026-09-27 07:12:29.256'),
(73, 2, 'PLANNING', 'canEdit', '2026-09-27 07:12:29.270'),
(74, 2, 'PLANNING', 'canDelete', '2026-09-27 07:12:29.290'),
(75, 2, 'PLANNING', 'canUpdateChecklist', '2026-09-27 07:12:29.364'),
(76, 2, 'PAYMENTS', 'canView', '2026-09-27 07:12:29.387'),
(77, 2, 'PAYMENTS', 'canExport', '2026-09-27 07:12:29.407'),
(78, 2, 'CUSTOMERS', 'canView', '2026-09-27 07:12:29.436'),
(79, 2, 'CUSTOMERS', 'canEdit', '2026-09-27 07:12:29.465'),
(80, 2, 'CUSTOMERS', 'canExport', '2026-09-27 07:12:29.478'),
(81, 2, 'CALENDAR', 'canView', '2026-09-27 07:12:29.498'),
(82, 2, 'RENT', 'canView', '2026-09-27 07:12:29.539'),
(83, 2, 'RENT', 'canCreate', '2026-09-27 07:12:29.553'),
(84, 2, 'RENT', 'canEdit', '2026-09-27 07:12:29.572'),
(85, 2, 'RENT', 'canDelete', '2026-09-27 07:12:29.586'),
(86, 2, 'RENT', 'canPrint', '2026-09-27 07:12:29.614'),
(87, 2, 'RENT', 'canExport', '2026-09-27 07:12:29.628'),
(88, 2, 'REPORTS', 'canView', '2026-09-27 07:12:29.647'),
(89, 2, 'REPORTS', 'canExport', '2026-09-27 07:12:29.661'),
(90, 2, 'MASTERS', 'canView', '2026-09-27 07:12:29.689'),
(91, 2, 'MASTERS', 'canCreate', '2026-09-27 07:12:29.731'),
(92, 2, 'MASTERS', 'canEdit', '2026-09-27 07:12:29.745'),
(93, 3, 'DASHBOARD', 'canView', '2026-09-27 07:12:29.806'),
(94, 3, 'ENQUIRIES', 'canView', '2026-09-27 07:12:29.820'),
(95, 3, 'ENQUIRIES', 'canCreate', '2026-09-27 07:12:29.853'),
(96, 3, 'ENQUIRIES', 'canEdit', '2026-09-27 07:12:29.887'),
(97, 3, 'ENQUIRIES', 'canAssign', '2026-09-27 07:12:29.906'),
(98, 3, 'ENQUIRIES', 'canChangeStatus', '2026-09-27 07:12:29.928'),
(99, 3, 'ENQUIRIES', 'canExport', '2026-09-27 07:12:29.948'),
(100, 3, 'QUOTATIONS', 'canView', '2026-09-27 07:12:29.970'),
(101, 3, 'QUOTATIONS', 'canCreate', '2026-09-27 07:12:29.997'),
(102, 3, 'QUOTATIONS', 'canEdit', '2026-09-27 07:12:30.043'),
(103, 3, 'QUOTATIONS', 'canPrint', '2026-09-27 07:12:30.078'),
(104, 3, 'QUOTATIONS', 'canExport', '2026-09-27 07:12:30.097'),
(105, 3, 'ORDERS', 'canView', '2026-09-27 07:12:30.111'),
(106, 3, 'PLANNING', 'canView', '2026-09-27 07:12:30.131'),
(107, 3, 'PAYMENTS', 'canView', '2026-09-27 07:12:30.144'),
(108, 3, 'CUSTOMERS', 'canView', '2026-09-27 07:12:30.197'),
(109, 3, 'CUSTOMERS', 'canExport', '2026-09-27 07:12:30.219'),
(110, 3, 'CALENDAR', 'canView', '2026-09-27 07:12:30.239'),
(111, 3, 'REPORTS', 'canView', '2026-09-27 07:12:30.272'),
(112, 4, 'DASHBOARD', 'canView', '2026-09-27 07:12:30.406'),
(113, 4, 'ENQUIRIES', 'canView', '2026-09-27 07:12:30.455'),
(114, 4, 'QUOTATIONS', 'canView', '2026-09-27 07:12:30.471'),
(115, 4, 'ORDERS', 'canView', '2026-09-27 07:12:30.502'),
(116, 4, 'ORDERS', 'canEdit', '2026-09-27 07:12:30.530'),
(117, 4, 'ORDERS', 'canCompleteEvent', '2026-09-27 07:12:30.596'),
(118, 4, 'PLANNING', 'canView', '2026-09-27 07:12:30.628'),
(119, 4, 'PLANNING', 'canCreate', '2026-09-27 07:12:30.646'),
(120, 4, 'PLANNING', 'canEdit', '2026-09-27 07:12:30.669'),
(121, 4, 'PLANNING', 'canDelete', '2026-09-27 07:12:30.688'),
(122, 4, 'PLANNING', 'canUpdateChecklist', '2026-09-27 07:12:30.736'),
(123, 4, 'PAYMENTS', 'canView', '2026-09-27 07:12:30.821'),
(124, 4, 'CUSTOMERS', 'canView', '2026-09-27 07:12:30.844'),
(125, 4, 'CALENDAR', 'canView', '2026-09-27 07:12:30.863'),
(126, 4, 'RENT', 'canView', '2026-09-27 07:12:30.886'),
(127, 4, 'RENT', 'canCreate', '2026-09-27 07:12:30.929'),
(128, 4, 'RENT', 'canEdit', '2026-09-27 07:12:30.955'),
(129, 4, 'RENT', 'canPrint', '2026-09-27 07:12:30.996'),
(130, 4, 'REPORTS', 'canView', '2026-09-27 07:12:31.018'),
(131, 5, 'DASHBOARD', 'canView', '2026-09-27 07:12:31.060'),
(132, 5, 'ENQUIRIES', 'canView', '2026-09-27 07:12:31.079'),
(133, 5, 'QUOTATIONS', 'canView', '2026-09-27 07:12:31.102'),
(134, 5, 'ORDERS', 'canView', '2026-09-27 07:12:31.121'),
(135, 5, 'PLANNING', 'canView', '2026-09-27 07:12:31.146'),
(136, 5, 'PAYMENTS', 'canView', '2026-09-27 07:12:31.169'),
(137, 5, 'PAYMENTS', 'canCreate', '2026-09-27 07:12:31.196'),
(138, 5, 'PAYMENTS', 'canEdit', '2026-09-27 07:12:31.219'),
(139, 5, 'PAYMENTS', 'canPrint', '2026-09-27 07:12:31.238'),
(140, 5, 'PAYMENTS', 'canExport', '2026-09-27 07:12:31.260'),
(141, 5, 'CUSTOMERS', 'canView', '2026-09-27 07:12:31.280'),
(142, 5, 'CALENDAR', 'canView', '2026-09-27 07:12:31.304'),
(143, 5, 'RENT', 'canView', '2026-09-27 07:12:31.437'),
(144, 5, 'RENT', 'canCreate', '2026-09-27 07:12:31.587'),
(145, 5, 'RENT', 'canExport', '2026-09-27 07:12:31.601'),
(146, 5, 'REPORTS', 'canView', '2026-09-27 07:12:31.634'),
(147, 5, 'REPORTS', 'canExport', '2026-09-27 07:12:31.662');

-- --------------------------------------------------------

--
-- Table structure for table `user_permission_overrides`
--

CREATE TABLE `user_permission_overrides` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `module` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('18cf5e0f-73b9-4f93-8888-684ad9163786', '14b74455777b624a3d8296bf4dcfe27dbeba6e44d19a189734f5000960c4f2a2', '2026-09-27 07:33:38.360', '20260927073319_add_enquiry_draft_status', NULL, NULL, '2026-09-27 07:33:37.113', 1),
('c8580296-b02a-4a60-aef8-99830e256622', '8b87502de1cb43fb74982c9b8159c7287febc923e6c5838082d541a7e9f6d6d9', '2026-09-27 07:11:20.948', '20260818000000_init', NULL, NULL, '2026-09-27 07:10:13.524', 1),
('cc468bca-7f84-4cb3-afb5-a32f538abd40', '578880d9957556ece6041df7d974c9cf0ede822478a9f2dba4982303947086e3', NULL, '20260818000000_init', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260818000000_init\n\nDatabase error code: 1064\n\nDatabase error:\nYou have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near \'JSON NULL,\r\n    `performed_by_id` INTEGER NULL,\r\n    `performed_at` DATETIME(3) \' at line 9\n\nPlease check the query number 29 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20260818000000_init\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name=\"20260818000000_init\"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226', '2026-09-27 07:08:33.192', '2026-09-27 07:08:04.292', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_logs_module_reference_id_idx` (`module`,`reference_id`),
  ADD KEY `activity_logs_company_id_fkey` (`company_id`),
  ADD KEY `activity_logs_performed_by_id_fkey` (`performed_by_id`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `customers_customer_code_key` (`customer_code`),
  ADD KEY `customers_mobile_idx` (`mobile`),
  ADD KEY `customers_customer_name_idx` (`customer_name`),
  ADD KEY `customers_city_idx` (`city`),
  ADD KEY `customers_company_id_fkey` (`company_id`);

--
-- Indexes for table `document_sequences`
--
ALTER TABLE `document_sequences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `document_sequences_company_id_sequence_type_year_key` (`company_id`,`sequence_type`,`year`);

--
-- Indexes for table `enquiries`
--
ALTER TABLE `enquiries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `enquiries_enquiry_number_key` (`enquiry_number`),
  ADD KEY `enquiries_event_date_idx` (`event_date`),
  ADD KEY `enquiries_status_idx` (`status`),
  ADD KEY `enquiries_follow_up_date_idx` (`follow_up_date`),
  ADD KEY `enquiries_company_id_fkey` (`company_id`),
  ADD KEY `enquiries_customer_id_fkey` (`customer_id`),
  ADD KEY `enquiries_assigned_user_id_fkey` (`assigned_user_id`),
  ADD KEY `enquiries_event_type_id_fkey` (`event_type_id`);

--
-- Indexes for table `enquiry_followups`
--
ALTER TABLE `enquiry_followups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `enquiry_followups_enquiry_id_fkey` (`enquiry_id`),
  ADD KEY `enquiry_followups_created_by_id_fkey` (`created_by_id`);

--
-- Indexes for table `event_types`
--
ALTER TABLE `event_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `event_types_company_id_event_name_key` (`company_id`,`event_name`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoices_order_id_key` (`order_id`),
  ADD UNIQUE KEY `invoices_invoice_number_key` (`invoice_number`),
  ADD KEY `invoices_company_id_fkey` (`company_id`),
  ADD KEY `invoices_issued_by_id_fkey` (`issued_by_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orders_order_number_key` (`order_number`),
  ADD KEY `orders_event_date_idx` (`event_date`),
  ADD KEY `orders_status_idx` (`status`),
  ADD KEY `orders_company_id_fkey` (`company_id`),
  ADD KEY `orders_enquiry_id_fkey` (`enquiry_id`),
  ADD KEY `orders_quotation_id_fkey` (`quotation_id`),
  ADD KEY `orders_customer_id_fkey` (`customer_id`),
  ADD KEY `orders_coordinator_id_fkey` (`coordinator_id`);

--
-- Indexes for table `order_documents`
--
ALTER TABLE `order_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_documents_order_id_fkey` (`order_id`),
  ADD KEY `order_documents_uploaded_by_id_fkey` (`uploaded_by_id`);

--
-- Indexes for table `order_tasks`
--
ALTER TABLE `order_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_tasks_order_id_fkey` (`order_id`),
  ADD KEY `order_tasks_assigned_to_id_fkey` (`assigned_to_id`),
  ADD KEY `order_tasks_completed_by_id_fkey` (`completed_by_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payments_receipt_number_key` (`receipt_number`),
  ADD KEY `payments_payment_date_idx` (`payment_date`),
  ADD KEY `payments_order_id_fkey` (`order_id`),
  ADD KEY `payments_received_by_id_fkey` (`received_by_id`);

--
-- Indexes for table `payment_trackers`
--
ALTER TABLE `payment_trackers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_trackers_order_id_key` (`order_id`),
  ADD KEY `payment_trackers_payment_status_idx` (`payment_status`);

--
-- Indexes for table `quotations`
--
ALTER TABLE `quotations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `quotations_enquiry_id_version_key` (`enquiry_id`,`version`),
  ADD KEY `quotations_company_id_idx` (`company_id`),
  ADD KEY `quotations_quotation_number_idx` (`quotation_number`),
  ADD KEY `quotations_customer_id_fkey` (`customer_id`),
  ADD KEY `quotations_order_id_fkey` (`order_id`),
  ADD KEY `quotations_created_by_id_fkey` (`created_by_id`);

--
-- Indexes for table `quotation_images`
--
ALTER TABLE `quotation_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quotation_images_quotation_id_idx` (`quotation_id`);

--
-- Indexes for table `quotation_items`
--
ALTER TABLE `quotation_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quotation_items_quotation_id_fkey` (`quotation_id`);

--
-- Indexes for table `rental_items`
--
ALTER TABLE `rental_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `rental_items_company_id_item_name_key` (`company_id`,`item_name`);

--
-- Indexes for table `rental_persons`
--
ALTER TABLE `rental_persons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `rental_persons_company_id_name_idx` (`company_id`,`name`),
  ADD KEY `rental_persons_phone_idx` (`phone`);

--
-- Indexes for table `rent_payments`
--
ALTER TABLE `rent_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `rent_payments_payment_no_key` (`payment_no`),
  ADD KEY `rent_payments_stock_out_id_idx` (`stock_out_id`),
  ADD KEY `rent_payments_rental_person_id_idx` (`rental_person_id`),
  ADD KEY `rent_payments_company_id_payment_date_idx` (`company_id`,`payment_date`),
  ADD KEY `rent_payments_received_by_id_fkey` (`received_by_id`);

--
-- Indexes for table `stock_outs`
--
ALTER TABLE `stock_outs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stock_outs_rent_no_key` (`rent_no`),
  ADD KEY `stock_outs_company_id_stock_out_date_idx` (`company_id`,`stock_out_date`),
  ADD KEY `stock_outs_rental_person_id_idx` (`rental_person_id`),
  ADD KEY `stock_outs_return_status_idx` (`return_status`),
  ADD KEY `stock_outs_payment_status_idx` (`payment_status`),
  ADD KEY `stock_outs_expected_return_date_idx` (`expected_return_date`),
  ADD KEY `stock_outs_created_by_id_fkey` (`created_by_id`);

--
-- Indexes for table `stock_out_items`
--
ALTER TABLE `stock_out_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_out_items_stock_out_id_idx` (`stock_out_id`),
  ADD KEY `stock_out_items_rental_item_id_fkey` (`rental_item_id`);

--
-- Indexes for table `stock_returns`
--
ALTER TABLE `stock_returns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stock_returns_return_no_key` (`return_no`),
  ADD KEY `stock_returns_stock_out_id_idx` (`stock_out_id`),
  ADD KEY `stock_returns_company_id_return_date_idx` (`company_id`,`return_date`),
  ADD KEY `stock_returns_created_by_id_fkey` (`created_by_id`);

--
-- Indexes for table `stock_return_items`
--
ALTER TABLE `stock_return_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_return_items_stock_return_id_idx` (`stock_return_id`),
  ADD KEY `stock_return_items_stock_out_item_id_idx` (`stock_out_item_id`);

--
-- Indexes for table `task_groups`
--
ALTER TABLE `task_groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_groups_order_id_display_order_idx` (`order_id`,`display_order`);

--
-- Indexes for table `task_items`
--
ALTER TABLE `task_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_items_task_group_id_display_order_idx` (`task_group_id`,`display_order`);

--
-- Indexes for table `task_templates`
--
ALTER TABLE `task_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_templates_company_id_fkey` (`company_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_username_key` (`username`),
  ADD UNIQUE KEY `users_email_key` (`email`),
  ADD KEY `users_mobile_idx` (`mobile`),
  ADD KEY `users_company_id_fkey` (`company_id`),
  ADD KEY `users_user_group_id_fkey` (`user_group_id`);

--
-- Indexes for table `user_groups`
--
ALTER TABLE `user_groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_groups_company_id_group_name_key` (`company_id`,`group_name`);

--
-- Indexes for table `user_group_permissions`
--
ALTER TABLE `user_group_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_group_permissions_user_group_id_module_action_key` (`user_group_id`,`module`,`action`);

--
-- Indexes for table `user_permission_overrides`
--
ALTER TABLE `user_permission_overrides`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_permission_overrides_user_id_module_action_key` (`user_id`,`module`,`action`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=171;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `document_sequences`
--
ALTER TABLE `document_sequences`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `enquiries`
--
ALTER TABLE `enquiries`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `enquiry_followups`
--
ALTER TABLE `enquiry_followups`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_types`
--
ALTER TABLE `event_types`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `order_documents`
--
ALTER TABLE `order_documents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_tasks`
--
ALTER TABLE `order_tasks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `payment_trackers`
--
ALTER TABLE `payment_trackers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `quotations`
--
ALTER TABLE `quotations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `quotation_images`
--
ALTER TABLE `quotation_images`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `quotation_items`
--
ALTER TABLE `quotation_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=421;

--
-- AUTO_INCREMENT for table `rental_items`
--
ALTER TABLE `rental_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rental_persons`
--
ALTER TABLE `rental_persons`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rent_payments`
--
ALTER TABLE `rent_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_outs`
--
ALTER TABLE `stock_outs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_out_items`
--
ALTER TABLE `stock_out_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_returns`
--
ALTER TABLE `stock_returns`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_return_items`
--
ALTER TABLE `stock_return_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `task_groups`
--
ALTER TABLE `task_groups`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `task_items`
--
ALTER TABLE `task_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `task_templates`
--
ALTER TABLE `task_templates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_groups`
--
ALTER TABLE `user_groups`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `user_group_permissions`
--
ALTER TABLE `user_group_permissions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=148;

--
-- AUTO_INCREMENT for table `user_permission_overrides`
--
ALTER TABLE `user_permission_overrides`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `activity_logs_performed_by_id_fkey` FOREIGN KEY (`performed_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `document_sequences`
--
ALTER TABLE `document_sequences`
  ADD CONSTRAINT `document_sequences_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `enquiries`
--
ALTER TABLE `enquiries`
  ADD CONSTRAINT `enquiries_assigned_user_id_fkey` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `enquiries_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `enquiries_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `enquiries_event_type_id_fkey` FOREIGN KEY (`event_type_id`) REFERENCES `event_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `enquiry_followups`
--
ALTER TABLE `enquiry_followups`
  ADD CONSTRAINT `enquiry_followups_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `enquiry_followups_enquiry_id_fkey` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `event_types`
--
ALTER TABLE `event_types`
  ADD CONSTRAINT `event_types_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `invoices_issued_by_id_fkey` FOREIGN KEY (`issued_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `invoices_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_coordinator_id_fkey` FOREIGN KEY (`coordinator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_enquiry_id_fkey` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `order_documents`
--
ALTER TABLE `order_documents`
  ADD CONSTRAINT `order_documents_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `order_documents_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `order_tasks`
--
ALTER TABLE `order_tasks`
  ADD CONSTRAINT `order_tasks_assigned_to_id_fkey` FOREIGN KEY (`assigned_to_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `order_tasks_completed_by_id_fkey` FOREIGN KEY (`completed_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `order_tasks_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_received_by_id_fkey` FOREIGN KEY (`received_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `payment_trackers`
--
ALTER TABLE `payment_trackers`
  ADD CONSTRAINT `payment_trackers_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `quotations`
--
ALTER TABLE `quotations`
  ADD CONSTRAINT `quotations_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `quotations_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `quotations_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `quotations_enquiry_id_fkey` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `quotations_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `quotation_images`
--
ALTER TABLE `quotation_images`
  ADD CONSTRAINT `quotation_images_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `quotation_items`
--
ALTER TABLE `quotation_items`
  ADD CONSTRAINT `quotation_items_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `rental_items`
--
ALTER TABLE `rental_items`
  ADD CONSTRAINT `rental_items_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `rental_persons`
--
ALTER TABLE `rental_persons`
  ADD CONSTRAINT `rental_persons_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `rent_payments`
--
ALTER TABLE `rent_payments`
  ADD CONSTRAINT `rent_payments_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `rent_payments_received_by_id_fkey` FOREIGN KEY (`received_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `rent_payments_rental_person_id_fkey` FOREIGN KEY (`rental_person_id`) REFERENCES `rental_persons` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `rent_payments_stock_out_id_fkey` FOREIGN KEY (`stock_out_id`) REFERENCES `stock_outs` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `stock_outs`
--
ALTER TABLE `stock_outs`
  ADD CONSTRAINT `stock_outs_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_outs_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_outs_rental_person_id_fkey` FOREIGN KEY (`rental_person_id`) REFERENCES `rental_persons` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `stock_out_items`
--
ALTER TABLE `stock_out_items`
  ADD CONSTRAINT `stock_out_items_rental_item_id_fkey` FOREIGN KEY (`rental_item_id`) REFERENCES `rental_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_out_items_stock_out_id_fkey` FOREIGN KEY (`stock_out_id`) REFERENCES `stock_outs` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `stock_returns`
--
ALTER TABLE `stock_returns`
  ADD CONSTRAINT `stock_returns_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_returns_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_returns_stock_out_id_fkey` FOREIGN KEY (`stock_out_id`) REFERENCES `stock_outs` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `stock_return_items`
--
ALTER TABLE `stock_return_items`
  ADD CONSTRAINT `stock_return_items_stock_out_item_id_fkey` FOREIGN KEY (`stock_out_item_id`) REFERENCES `stock_out_items` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_return_items_stock_return_id_fkey` FOREIGN KEY (`stock_return_id`) REFERENCES `stock_returns` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `task_groups`
--
ALTER TABLE `task_groups`
  ADD CONSTRAINT `task_groups_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `task_items`
--
ALTER TABLE `task_items`
  ADD CONSTRAINT `task_items_task_group_id_fkey` FOREIGN KEY (`task_group_id`) REFERENCES `task_groups` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `task_templates`
--
ALTER TABLE `task_templates`
  ADD CONSTRAINT `task_templates_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `users_user_group_id_fkey` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `user_groups`
--
ALTER TABLE `user_groups`
  ADD CONSTRAINT `user_groups_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `user_group_permissions`
--
ALTER TABLE `user_group_permissions`
  ADD CONSTRAINT `user_group_permissions_user_group_id_fkey` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `user_permission_overrides`
--
ALTER TABLE `user_permission_overrides`
  ADD CONSTRAINT `user_permission_overrides_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
