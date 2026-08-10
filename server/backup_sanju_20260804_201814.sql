-- MySQL dump 10.13  Distrib 8.4.9, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: sanju
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `sanju`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `sanju` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `sanju`;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('03dea2c1-438b-4788-bba1-5f2322f7fbdf','7d2d5d10df5e7cde8c538d7329cef8194e0f3a6936fda65e5443e700d0424de1','2026-07-21 14:54:23.153','20260719091100_add_customer_city',NULL,NULL,'2026-07-21 14:54:23.114',1),('13155a27-373a-40fd-834e-4963388e394e','f64cea77409e8cb6d7bc2ea1e4b59ec33062f60700bdf68ce27dd79b64a13ff3','2026-07-21 14:54:23.172','20260719093252_enquiry_notes_meeting_location_and_customer_sequence',NULL,NULL,'2026-07-21 14:54:23.155',1),('22deb675-b5c4-4f4f-8dd5-d6877c964b21','d3fda974005c5ccaa114488922bf8a9a4011bc4d15cf8ac7dfb5e4848136dbbe','2026-08-02 10:14:57.247','20260802154420_replace_order_status_with_lifecycle_stages',NULL,NULL,'2026-08-02 10:14:57.183',1),('40b81750-9523-401f-8f9b-8073ebcf56c5','a12af027877d02e93a86c4aca11c4444015dc224634fe85fee77c41faf0a8777','2026-07-29 14:49:11.884','20260729144911_task_plan_groups_and_items',NULL,NULL,'2026-07-29 14:49:11.817',1),('410dd9ac-a3c1-4a8f-9950-bd30302db81a','98087ffa90daf8fdf4c4b333aa5b56fb0331eaaebdddff549282d4cac94780c0','2026-08-03 18:26:05.475','20260803182605_add_enquiry_advance_amount',NULL,NULL,'2026-08-03 18:26:05.467',1),('414d8671-c368-4676-a6e2-bb190c0c6387','d962df7e16166b21ac1a12a33d47e1c45444ead62764542b70f58c702c36d6b6','2026-07-29 18:40:34.399','20260729210000_company_terms_and_conditions',NULL,NULL,'2026-07-29 18:40:34.384',1),('4fc0cc1c-2493-4525-a094-61777a801904','0e322a55af6f52540b1c85125b813f174204037f899622a6c8dbaed36ce7f190','2026-07-24 06:57:27.238','20260724065727_enquiry_appointment_status',NULL,NULL,'2026-07-24 06:57:27.224',1),('64300abf-d8c1-44e1-bccb-f8af6f91cb48','d8d8d250dc9cd781b7c267764c9ecbf4ebc484f28a78a27aa05a7275f0da1325','2026-07-30 16:03:05.557','20260730160305_add_payment_tracker',NULL,NULL,'2026-07-30 16:03:05.524',1),('70d3ec7d-dc2a-4fc7-b750-e2a0a99cb25c','674886722b3b4e5d3c02ddbec44f2a7901ca6814b870e405ed05afe43052882e','2026-07-30 16:54:01.159','20260730165401_add_invoices',NULL,NULL,'2026-07-30 16:54:01.031',1),('7a8b64a0-34c0-4e3c-944e-d4ac6b0b6b87','0b716da913299d6226e5c69365706978f79de73e66c0ac5006309a83b6fba27d','2026-07-30 20:01:01.233','20260731010000_user_groups_and_permission_catalog',NULL,NULL,'2026-07-30 20:01:00.998',1),('7b794450-56f9-4ca8-9f7e-d542f681889d','9d05dfd3036fa266c1082e4d18f4f76c6ac5584924aab5cbd46f3fd097a392c4','2026-07-21 15:50:14.787','20260721154941_quotation_multi_source_and_company_branding',NULL,NULL,'2026-07-21 15:50:14.650',1),('7fbda19f-0b6e-4159-9da4-b3e1a03610f7','ad589a844e363060e4c9a7b85122332c77aa6dbe28b7cca994d725cb1c2abcb9','2026-07-21 14:54:23.296','20260721000000_simplify_enquiry_status_and_defer_customer',NULL,NULL,'2026-07-21 14:54:23.196',1),('8402bd63-366e-427d-b499-be438a40a92c','cba4a619bc48db0e345a39b110aabafc16fdc68bbec5890e93583d606af18c49','2026-07-30 15:22:17.727','20260730152217_task_group_draft_status',NULL,NULL,'2026-07-30 15:22:17.718',1),('8689335e-067e-4a33-99eb-e1c0b0c6b9fd','2603038db046f04871b1e7840888d4e6bef9bd97dae057c364e639412a69a538','2026-07-30 16:03:35.967','20260730160500_backfill_payment_trackers',NULL,NULL,'2026-07-30 16:03:35.954',1),('a0bd6108-5278-4ae6-884c-203380f45a31','55dd217627a9b935ab6aaf1c98da823c5910581f49da63b6bff59758b9b3319b','2026-07-21 14:54:23.181','20260719102227_order_notes_and_remarks',NULL,NULL,'2026-07-21 14:54:23.174',1),('a1d93c06-6062-40e3-a026-7a650591fe25','fa6fdc94088ab989970f297a0599f1cdd221bee0623bd4cae552315706ee50c1','2026-07-21 14:54:23.194','20260719113934_settings_module_gst_and_rbac',NULL,NULL,'2026-07-21 14:54:23.183',1),('be850cf5-7bf9-4b05-b129-f9784068ec92','2b2aa5600609084966485908fc6946cac0f7211f99e092a5dbd9995725486a74','2026-07-21 14:54:23.112','20260719074454_init',NULL,NULL,'2026-07-21 14:54:22.257',1),('c21b7833-57d6-412b-8632-da3d8f52dbc6','4d77c71c3ff90aef63638965024f565a425143ac7b6372d1f9d29d456c6be7f7','2026-07-21 18:23:06.247','20260721182306_quotation_cgst_sgst_split',NULL,NULL,'2026-07-21 18:23:06.236',1),('c34f11a1-c390-4316-9ca1-6dbe45c27094','772ddc085a5bb9f61813237f468a843a4b548ea47bf244a8da5e3bf4aad984fb','2026-07-21 18:03:06.721','20260721180306_quotation_gst_percent',NULL,NULL,'2026-07-21 18:03:06.703',1),('d4c494e0-e217-4934-82f1-93c689d1fea4','7f7e521e8b838dec22c779a322881700c09db4cd36374eb59a9d83bcac9dea1b','2026-07-27 18:18:08.645','20260727181808_add_enquiry_final_budget_amount',NULL,NULL,'2026-07-27 18:18:08.637',1),('e2dbabb7-f0e7-41f7-8a03-12f33d8e0efa','b63849503b3828ef024340f28b7b4a2b8f47310f45be9e06b85abc2c61e26ebc','2026-07-21 18:59:27.414','20260721185927_quotation_images',NULL,NULL,'2026-07-21 18:59:27.381',1),('fc263a10-5344-4a9a-91ec-a43407dedb98','6f77ed16c76d810ad40504f0a6baae5b24d08d4bd86a58779518c08300ee9bc8','2026-07-24 07:15:30.276','20260724071530_enquiry_appointment_status_cancelled',NULL,NULL,'2026-07-24 07:15:30.269',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` char(36) NOT NULL,
  `company_id` char(36) DEFAULT NULL,
  `module` varchar(191) NOT NULL,
  `reference_id` char(36) NOT NULL,
  `action` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `performed_by_id` char(36) DEFAULT NULL,
  `performed_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `activity_logs_module_reference_id_idx` (`module`,`reference_id`),
  KEY `activity_logs_company_id_fkey` (`company_id`),
  KEY `activity_logs_performed_by_id_fkey` (`performed_by_id`),
  CONSTRAINT `activity_logs_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `activity_logs_performed_by_id_fkey` FOREIGN KEY (`performed_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES ('0229657c-74e3-4122-b813-0f307b047c4b','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','5fb4491e-ba6c-4bea-ab1b-d0968a84102d','PRINT','Quotation PDF \"QTN-2026-00003-v3.pdf\" downloaded.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 12:04:44.570'),('02a54ea8-34f3-4f2f-9b47-f25032e5a949','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 20:42:28.649'),('038217b0-af2a-4c80-a1aa-53f589c7b54c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 15:32:14.115'),('044fd255-291d-40b4-b4d7-4be03b0b368e','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','e6d42e37-9a70-426d-a9d1-72f1e3e55c64','STATUS_CHANGE','Task \"stage\" status changed from COMPLETED to PENDING.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 19:10:06.366'),('049e5791-e3b5-49e3-ab60-eada300636b5','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','a7bb6f75-365d-4898-8e9c-c1ddd4a9d364','APPROVE','Quotation \"QTN-2026-00002\" (v2) approved.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 19:22:46.775'),('07a808b8-6413-4604-bd7c-36d5151d2f71','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','4ee97f25-0387-4603-b3b4-94def432ee43','CREATE','Task group \"Cleaning\" with 0 task(s) added to order \"ORD-2026-00002\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-29 15:18:25.036'),('07bc91be-0cf1-4f3c-afd6-435150c30fd6','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 20:13:03.779'),('086f780b-505e-4e46-83f8-f79e37ef433c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-28 15:13:39.368'),('08b3c5cc-29e3-4983-8971-7f1a1b247a87','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 14:32:46.428'),('08eced3c-e586-413f-bb54-d3aaea6dbda8','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 21:00:01.611'),('09f7e940-f4c4-4199-95dc-5fcd6f7b7f4c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:05:19.855'),('0c010d8a-3d52-43e4-960f-d5a507055c21','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','a7bb6f75-365d-4898-8e9c-c1ddd4a9d364','STATUS_CHANGE','Quotation \"QTN-2026-00002\" (v2) marked as SENT.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 19:22:25.914'),('0cb54780-d2ea-4c54-b920-4e3258144016','65954d03-7a19-44ad-8f9a-2e31bb53abb5','MASTERS','233c8bdf-6178-4fa6-b997-4e3c2a786169','UPDATE','Event type \"Birth Day\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-28 16:27:33.537'),('0ddb7579-eea1-4e0e-85fa-400101cab142','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 16:34:58.143'),('0dfe985f-811c-46ba-b196-74cf1a46c5a2','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','d1c1d7ba-a244-4c5b-a692-d469d74866d3','STATUS_CHANGE','Task group \"ZZ Verify Draft Group\" published to the team.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 15:32:14.484'),('0f8625f0-51cd-4aa1-a01d-3014fa8b9d01','65954d03-7a19-44ad-8f9a-2e31bb53abb5','USER_GROUPS','a8d1510a-0d15-432e-8e51-85f3e2c19843','UPDATE','User group \"Event Coordinator\" updated.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-31 18:40:53.118'),('114b2c18-fa8c-4e4d-8bc1-ce5912d95531','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 15:17:37.229'),('1360aecf-b894-4933-a887-d91621f15ab2','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PAYMENT_TRACKER','d7a5ffba-7b72-40f7-afec-10380a73c7b1','PAYMENT','Collected 300 (PARTIAL) via CASH for order \"ORD-2026-00002\" (receipt RCT-2026-00002).',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 16:16:43.299'),('1371d12c-a7a7-4727-915a-2494091a9203','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PAYMENT_TRACKER','d7a5ffba-7b72-40f7-afec-10380a73c7b1','UPDATE','Budget for order \"ORD-2026-00002\" changed from 560 to 2000.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 16:16:26.694'),('156d4bb9-ee15-49df-89e6-b9c507bf1104','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:38:36.834'),('157fbb97-d3e5-4bc2-8baf-0d0bb8c27f5b','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 16:35:33.978'),('15f6699c-e3d5-4ca6-a38c-3bbdcde20b22','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','06990651-b80b-4b3a-9cfb-03e83d8232fb','CREATE','Task group \"Stage decor\" with 1 task(s) added to order \"ORD-2026-00002\".',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-30 15:11:16.388'),('17106bf5-b0ca-40da-a935-8aceb2137e5d','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:55:16.745'),('17d77153-551b-4c14-b72a-92099e00c31c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 14:31:15.106'),('18dac82c-c228-4c7b-82e1-f33191eedf24','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','33d94cd5-9353-4de7-b665-3f5a33f3a6f0','CREATE','Enquiry \"ENQ-2026-00001\" created.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 15:15:20.174'),('1b2ec41f-7a36-4eb1-8eb5-52614932cab0','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','e6d42e37-9a70-426d-a9d1-72f1e3e55c64','STATUS_CHANGE','Task \"stage\" status changed from PENDING to COMPLETED.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 19:10:03.755'),('1b35e400-5c70-4453-8d53-5b4a89620cc4','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','428a24f0-87f0-4729-b7bc-8631656781a6','UPDATE','Enquiry \"ENQ-2026-00002\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 07:04:23.594'),('1b56e4ee-4158-43bb-b248-44a8d4364d98','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','8761de4c-5ee4-48bd-928f-ae7461f0c7fb','CREATE','Enquiry \"ENQ-2026-00003\" created.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 04:35:52.432'),('1bec608b-05a3-44ed-913b-47bc9f7980b5','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 14:57:52.318'),('1bfacf65-3aa3-4bf7-ab2e-ff3f475b9d6f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','3a739d5a-8253-469a-94ea-1f8b0a4a146c','DELETE','Task group \"Chair Allocation\" and its 2 task(s) deleted from order \"ORD-2026-00002\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-29 15:04:00.611'),('1c73a2e5-12e5-4024-ae8e-9e35b3a1af0f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','4ee97f25-0387-4603-b3b4-94def432ee43','DELETE','Task group \"Cleaning\" and its 0 task(s) deleted from order \"ORD-2026-00002\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-29 15:18:35.588'),('1c845aa4-58de-4d53-b3b1-a099946cf640','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','ee24c6d3-51df-4425-8e33-e55ca2bddd1d','STATUS_CHANGE','Task \"hall\" status changed from PENDING to COMPLETED.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 19:10:16.200'),('1c9a94f5-245d-48e3-b86f-5fe6f79b21fb','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','0f86fdae-59cb-4508-963f-aec4e4c9cc2e','CREATE','Quotation \"QTN-2026-00001\" (v1) created from ENQUIRY.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 19:13:35.589'),('1fac050c-e895-47bc-80b1-995f8e96308f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-29 15:18:24.570'),('20457e95-3de4-485c-bdea-3c2d57a3043e','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','a7bb6f75-365d-4898-8e9c-c1ddd4a9d364','STATUS_CHANGE','Quotation \"QTN-2026-00002\" (v2) marked as SENT.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 19:22:41.578'),('20b4ece7-6c85-4ea1-a0e5-1a1a2958dbcd','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PAYMENT_TRACKER','d7a5ffba-7b72-40f7-afec-10380a73c7b1','STATUS_CHANGE','Payment status for order \"ORD-2026-00002\" set to FULLY_PAID manually.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 16:16:43.734'),('20d3d22a-815d-4288-a30e-51530fc6193a','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','dd51ff13-a618-4731-bbb3-d04cb1ac2aad','CREATE','Quotation \"QTN-2026-00003\" (v1) created from ENQUIRY.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 09:43:50.072'),('20d85e59-503d-4af1-8eca-41d202c53d45','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','ee24c6d3-51df-4425-8e33-e55ca2bddd1d','STATUS_CHANGE','Task \"hall\" status changed from COMPLETED to PENDING.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 19:10:17.265'),('20f61915-4e55-4744-89a1-e242b13958e3','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PAYMENT_TRACKER','d7a5ffba-7b72-40f7-afec-10380a73c7b1','PAYMENT','Collected 500 (ADVANCE) via UPI for order \"ORD-2026-00002\" (receipt RCT-2026-00001).',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 16:16:26.698'),('266524e8-500d-4749-ae28-047aefddfc30','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 19:12:06.063'),('27860d34-1264-45f2-b4da-46ae5f43503e','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','a7bb6f75-365d-4898-8e9c-c1ddd4a9d364','APPROVE','Quotation \"QTN-2026-00002\" (v2) approved.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 19:22:32.810'),('27c4a926-632c-476c-86e7-ad278b52f48e','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 16:16:32.654'),('28b10f67-088b-4cfd-8dd7-3e5de17c9622','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 19:11:12.774'),('2b0521de-dccd-4605-8bef-576b46ca28cf','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','523c2a5e-0717-40ff-bf4a-afe561af6960','STATUS_CHANGE','Enquiry \"ENQ-2026-00004\" status changed from QUOTATION_SHARED to APPOINTMENT_FIXED.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-02 09:19:47.445'),('2b51f781-5863-4096-8803-01c2dc301987','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','33d94cd5-9353-4de7-b665-3f5a33f3a6f0','STATUS_CHANGE','Enquiry \"ENQ-2026-00001\" status changed from QUOTATION_SHARED to ORDER_CONFIRMED.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 12:49:05.357'),('2bf2fef2-c737-4541-b1ff-954ddba7ad3c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 15:18:04.258'),('2c2c87c2-491d-43b1-bfb9-09e5439f4d43','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','08e5bd93-c6fa-4013-935e-318bbb10b9dc','CREATE','Task group \"ZZ Verify Published Group\" with 1 task(s) added to order \"ORD-2026-00002\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 15:32:14.319'),('2c7233a4-c173-4079-a07c-c7d57b53c936','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-30 20:38:30.026'),('2de7706f-97ae-4e6f-a6f5-5d2a12410879','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-30 20:39:20.214'),('2e3f7c80-a176-420a-bb67-42d4fde17403','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 16:05:16.300'),('2f2ffd68-12a3-4fe5-9321-f91792aa8ac0','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','e6d42e37-9a70-426d-a9d1-72f1e3e55c64','STATUS_CHANGE','Task \"stage\" status changed from PENDING to COMPLETED.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 19:10:13.175'),('3081dd54-99a5-4e26-9c39-578d7d57e31b','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','5aef356d-58a0-407a-bdb7-8901168ff78c','PRINT','Quotation PDF \"QTN-2026-00001-v1.pdf\" downloaded.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 19:11:13.585'),('31d39d0d-5210-4d77-99aa-a009bff384c7','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','197543ad-2fb5-4fae-9d7e-91f0f8776d4e','CREATE','Task group \"Stage Decoration\" with 3 task(s) added to order \"ORD-2026-00002\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-29 15:18:24.902'),('31d82f2b-d41b-4c45-9d0b-76a1fc5802d9','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','3a739d5a-8253-469a-94ea-1f8b0a4a146c','CREATE','Task group \"Chair Allocation\" added to order \"ORD-2026-00002\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-29 15:03:23.269'),('32f85e43-4e1b-4234-a901-0df0509981b2','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','82a65c1e-60c4-4f1b-9a66-920e5f639832','CREATE','Quotation \"QTN-2026-00004\" (v1) created from ENQUIRY.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 14:39:44.930'),('358a5858-f461-4499-9b08-f3aacca28da5','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 14:56:29.451'),('382cb986-6053-461d-b965-c71869df6e48','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ORDERS','92621269-d7c3-4eed-88e0-26790c027c2d','ORDER_CONVERSION','Order \"ORD-2026-00001\" created from enquiry \"ENQ-2026-00001\" and quotation \"QTN-2026-00001\" (v1).',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 13:05:01.045'),('38deb3bb-c222-4678-8ae7-63957e5846ee','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','e8f0d275-29e3-481e-9344-832a3a9abd02','CREATE','Quotation \"QTN-2026-00002\" (v1) created from ENQUIRY.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 16:08:00.216'),('3999206b-bc6d-4ce9-a5a7-e2b5f066c6cb','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 21:00:59.827'),('39a90586-a8b6-4f4a-aece-cc1372ac60a3','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 20:47:18.788'),('3a4279cf-2ec4-4a4c-b153-a31f8af5ef50','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','5fb4491e-ba6c-4bea-ab1b-d0968a84102d','CREATE','Quotation \"QTN-2026-00003\" (v3) created from ENQUIRY.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 11:44:57.588'),('3a4af0bb-c2d8-457b-9969-8bafde4c0fcf','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','6a49efd3-ac61-451f-8f5e-95d4c3579904','CREATE','Quotation \"QTN-2026-00001\" (v1) created from MANUAL.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 16:07:17.343'),('3ae58e87-b355-4103-883e-2f4487ba0b33','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGOUT',NULL,NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-30 15:02:48.993'),('3cb546c5-2a8b-4a79-a39e-3c734acfdc5e','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:30:21.496'),('3d9c9a55-4ecb-4893-bfb8-d4cda6dad1d1','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:54:42.011'),('3ed4ea56-8dad-4b03-9bcb-a287bf98719d','65954d03-7a19-44ad-8f9a-2e31bb53abb5','MASTERS','233c8bdf-6178-4fa6-b997-4e3c2a786169','CREATE','Event type \"Birth Day\" created.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 15:13:20.133'),('403dc077-13f1-4ec6-8940-da960e2323f9','65954d03-7a19-44ad-8f9a-2e31bb53abb5','SETTINGS','65954d03-7a19-44ad-8f9a-2e31bb53abb5','UPDATE','Company logo updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 16:19:11.495'),('41c81aca-20cf-45c3-a770-13d3adbd4d31','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','5a3c4615-7a81-4011-a66d-8a8165281d4e','STATUS_CHANGE','Task \"Hall Chair Arrangement\" status changed from COMPLETED to PENDING.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-29 15:03:43.561'),('421c1c72-eda9-4a00-8a87-ed22c5843cfd','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','7d7f8276-f71e-4666-b8ef-f80b0f4c4d0e','CREATE','Quotation \"QTN-2026-00003\" (v2) created from ENQUIRY.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 10:21:32.758'),('42a6e17f-eeb7-4ff2-9732-1c898af98b9d','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 20:11:14.220'),('439b56db-1493-4ed0-af6d-ea02af95f858','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:24:44.261'),('439c404d-daa4-46e3-bd63-b30f05465598','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 16:35:07.168'),('45e48acb-3ece-48fc-8624-4c44f5b647e7','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 14:58:57.055'),('45f2945d-998c-4187-b09a-573c87b98f56','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:41:31.785'),('46b09cc5-79ef-46ff-b955-8b9336f334bb','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','5a3c4615-7a81-4011-a66d-8a8165281d4e','UPDATE','Completion photo uploaded for task \"Hall Chair Arrangement\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-29 15:03:43.259'),('4a35d51c-fe9f-4f94-8b4c-08c9c78af174','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:40:46.684'),('4b1ae4fb-2202-4607-ac2d-d74909bb0405','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','f36a56b0-6321-4c91-98d4-a17db1681b71','STATUS_CHANGE','Quotation \"QTN-2026-00004\" (v2) marked as SENT.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 14:42:45.959'),('4b37201c-2e07-4317-925a-5b483a224b61','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','32a4e2fe-1959-4667-9241-45a876c27c2a','APPROVE','Quotation \"QTN-2026-00001\" (v1) approved.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 12:49:00.058'),('4b57d197-c4b6-498d-bb67-2c2bde6ffcd4','65954d03-7a19-44ad-8f9a-2e31bb53abb5','INVOICES','92621269-d7c3-4eed-88e0-26790c027c2d','CREATE','Invoice \"INV-2026-00003\" issued for order \"ORD-2026-00001\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 17:00:30.561'),('4cc70eca-1607-4073-ba82-c07af3756651','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','8761de4c-5ee4-48bd-928f-ae7461f0c7fb','UPDATE','Enquiry \"ENQ-2026-00003\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 07:04:37.143'),('4dc56a30-b8da-4af1-88a2-c43283e31e17','65954d03-7a19-44ad-8f9a-2e31bb53abb5','MASTERS','cc5482d7-7829-48f5-9046-fc6a93cdf6e6','UPDATE','Event type \"Wedding\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-28 16:27:20.343'),('5077fecc-b4a9-4072-8f1e-e0b1d78d0eef','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','08e5bd93-c6fa-4013-935e-318bbb10b9dc','DELETE','Task group \"ZZ Verify Published Group\" and its 1 task(s) deleted from order \"ORD-2026-00002\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 15:32:14.562'),('50e97aee-caee-49af-a80f-ad4922cf2b3b','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','0f86fdae-59cb-4508-963f-aec4e4c9cc2e','PRINT','Quotation PDF \"QTN-2026-00001-v1.pdf\" downloaded.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 19:14:41.885'),('50f845a9-c417-4a9e-be7c-7f5e73176959','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','428a24f0-87f0-4729-b7bc-8631656781a6','UPDATE','Enquiry \"ENQ-2026-00002\" updated.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:25:04.050'),('51c5159e-b99a-48f1-8cfa-13e49a02a334','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 15:30:06.972'),('52171432-6cd5-4848-8361-f28ccc20384c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','428a24f0-87f0-4729-b7bc-8631656781a6','UPDATE','Enquiry \"ENQ-2026-00002\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 19:23:05.290'),('54295a1b-db25-4440-98c1-82c0b9d4c5aa','65954d03-7a19-44ad-8f9a-2e31bb53abb5','MASTERS','cc5482d7-7829-48f5-9046-fc6a93cdf6e6','UPDATE','Event type \"Wedding\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 15:13:29.487'),('54661e38-5aaf-4507-abd7-38b3494d050c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','189e9b91-d687-4401-89f4-39cb077889bb','STATUS_CHANGE','Task \"mess\" status changed from COMPLETED to PENDING.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 19:10:19.767'),('548df452-a49c-4b73-a2c2-651f8d114a2f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','c8824d1a-3eae-45c6-a84a-a5ae694c3570','CREATE','Task \"VIP Chair Arrangement\" added to task group \"Chair Allocation\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-29 15:03:23.662'),('54c64bf1-a514-4399-b2a2-304bd86e4514','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-31 18:12:29.360'),('55b05d7a-db22-45f5-aada-19a64863256a','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','e6d42e37-9a70-426d-a9d1-72f1e3e55c64','STATUS_CHANGE','Task \"stage\" status changed from COMPLETED to PENDING.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 19:10:14.227'),('55fdfdcd-5c79-4564-a6f6-b7dddbfecdad','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 17:00:13.017'),('5639db0b-668c-47b1-ad47-a8c453b1a4a0','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','c8cc701c-fa33-4348-a5f8-c9c3da6c75ea','STATUS_CHANGE','Quotation \"QTN-2026-00002\" (v1) marked as SENT.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 19:22:14.634'),('56c776d2-46b8-42e3-bc1a-8bddc137e8f7','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','523c2a5e-0717-40ff-bf4a-afe561af6960','UPDATE','Enquiry \"ENQ-2026-00004\" updated.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-02 08:56:59.736'),('56ef58e6-9876-442e-85e0-5b42b913c255','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-30 20:38:04.447'),('590ac315-45c5-4e1a-bc88-ec70c09bc5b0','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','f36a56b0-6321-4c91-98d4-a17db1681b71','CREATE','Quotation \"QTN-2026-00004\" (v2) created from ENQUIRY.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 14:41:12.489'),('59bd40c0-2975-42ff-a1d2-208077a9c0f4','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','8761de4c-5ee4-48bd-928f-ae7461f0c7fb','UPDATE','Enquiry \"ENQ-2026-00003\" updated.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-02 14:16:48.220'),('59c37eb5-ee6d-4191-aa0c-436c00b874ae','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','5a3c4615-7a81-4011-a66d-8a8165281d4e','CREATE','Task \"Hall Chair Arrangement\" added to task group \"Chair Allocation\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-29 15:03:23.547'),('5a6a42c2-053a-477b-88af-df8c4ae81a97','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','a7bb6f75-365d-4898-8e9c-c1ddd4a9d364','CREATE','Quotation \"QTN-2026-00002\" (v2) created from ENQUIRY.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 11:34:00.022'),('5bf04832-0143-4fa2-a3a9-980f77d7183e','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:52:28.187'),('5cde9d0e-d0b7-4b11-aef4-c6222fb78dbb','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:08:31.734'),('5f83bee4-0c31-4ee1-b5c7-7a0600523790','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 16:16:04.656'),('6038a09a-3e29-40fb-b715-cdef8efedd47','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','82a65c1e-60c4-4f1b-9a66-920e5f639832','STATUS_CHANGE','Quotation \"QTN-2026-00004\" (v1) marked as SENT.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 17:50:07.658'),('60af3caf-8ffa-483d-bbdf-ccd786172cb7','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:39:55.998'),('6138b40a-c101-4131-bbbd-24f02945ced9','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','143d3964-9456-4b19-8924-0b21c22b9b53','CREATE','Enquiry \"ENQ-2026-00006\" created.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-03 19:00:53.573'),('61906b48-4d87-48ba-856b-8ab96c9340d3','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 13:48:04.624'),('61ca99c9-d661-4734-b5fb-e473a36eb7ba','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-31 18:17:25.811'),('62ebb920-cd95-406d-85a8-bac66bca4d65','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ORDERS','715c3796-4640-4be3-ac7f-2e1857cbd23c','ORDER_CONVERSION','Order \"ORD-2026-00003\" created from enquiry \"ENQ-2026-00004\" and quotation \"QTN-2026-00004\" (v1).',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 15:31:00.935'),('62ec4c78-8e56-4754-aece-7eee9bb5c07e','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 15:21:01.080'),('6305d3cb-a2e7-41dc-9b59-1df32e869033','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ORDERS','d7a5ffba-7b72-40f7-afec-10380a73c7b1','STATUS_CHANGE','Order \"ORD-2026-00002\" status changed from IN_PROGRESS to ORDER_CLOSED.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-02 12:57:15.082'),('6363844b-89a2-4680-86de-2823be7e3d4f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','3f4eac8b-392e-43bf-8137-c99ec3101081','CREATE','Quotation \"QTN-2026-00002\" (v2) created from ENQUIRY.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 19:10:26.472'),('6403fc61-9cb9-459b-a423-96efef2f76b7','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','f36a56b0-6321-4c91-98d4-a17db1681b71','UPDATE','1 sample image(s) added to quotation \"QTN-2026-00004\".',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 14:41:12.587'),('64866774-76de-42a1-842a-efbf0759683c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','SETTINGS','65954d03-7a19-44ad-8f9a-2e31bb53abb5','UPDATE','Company information updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 18:52:22.892'),('649a48d3-b41e-4f4d-aa6e-f297b522df1c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','428a24f0-87f0-4729-b7bc-8631656781a6','CREATE','Enquiry \"ENQ-2026-00002\" created.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-22 20:04:32.781'),('6588b90c-973a-4ebe-aa79-9f224ee12009','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 16:07:49.132'),('66178bcc-8e6b-463c-83eb-30e591a740f7','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-30 20:39:43.359'),('672455b0-19b1-4fad-bfc8-fe9dbaa14d23','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','523c2a5e-0717-40ff-bf4a-afe561af6960','STATUS_CHANGE','Enquiry \"ENQ-2026-00004\" status changed from APPOINTMENT_FIXED to ORDER_CONFIRMED.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-02 09:19:53.269'),('6abf2ba5-d3d9-4eea-9640-484cd26641bc','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','dd51ff13-a618-4731-bbb3-d04cb1ac2aad','UPDATE','1 sample image(s) added to quotation \"QTN-2026-00003\".',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 09:43:50.161'),('6ac4065a-b1e8-49e9-8feb-75c4febbb4e0','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ORDERS','d7a5ffba-7b72-40f7-afec-10380a73c7b1','ORDER_CONVERSION','Order \"ORD-2026-00002\" created from enquiry \"ENQ-2026-00002\" and quotation \"QTN-2026-00002\" (v2).',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 15:21:01.140'),('6c45241e-409e-481a-bb1d-531cc8d82ea5','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 20:14:45.620'),('6d326e8a-0b6c-48ef-80b6-e014e08d15b3','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','523c2a5e-0717-40ff-bf4a-afe561af6960','UPDATE','Enquiry \"ENQ-2026-00004\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 15:16:48.406'),('6da489ac-8feb-414e-b44e-14a084af79e8','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','33d94cd5-9353-4de7-b665-3f5a33f3a6f0','UPDATE','Enquiry \"ENQ-2026-00001\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 12:49:07.739'),('70b24240-f013-4a73-bdd0-39925180b693','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:57:39.094'),('71473884-f801-4825-af3b-44aad303e2d3','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:32:45.816'),('71b5ba9d-d9eb-43b8-ae33-fb8643e7d4c7','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','32a4e2fe-1959-4667-9241-45a876c27c2a','PRINT','Quotation PDF \"QTN-2026-00001-v1.pdf\" downloaded.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 19:30:10.118'),('7203110a-6418-43b9-8e3b-cc318b06d51a','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PAYMENT_TRACKER','d7a5ffba-7b72-40f7-afec-10380a73c7b1','STATUS_CHANGE','Payment status for order \"ORD-2026-00002\" returned to automatic.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 16:16:44.062'),('724e25cf-2a72-496d-94a2-4f59a90e1576','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-29 15:02:55.815'),('72b34764-e010-4c3f-b9d2-d172f0d72419','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 19:10:26.049'),('734fea48-16c0-41ea-b532-8d6b628794da','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','a7bb6f75-365d-4898-8e9c-c1ddd4a9d364','APPROVE','Quotation \"QTN-2026-00002\" (v2) approved.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:24:44.370'),('73c9fbde-3bea-4862-8e15-6ae554b7af6a','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','82a65c1e-60c4-4f1b-9a66-920e5f639832','STATUS_CHANGE','Quotation \"QTN-2026-00004\" (v1) marked as SENT.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 15:09:27.686'),('74477f28-f1ef-4481-bacd-3e40fdadf2e9','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 06:05:57.891'),('74b23b97-776f-4a1c-a489-3e3884a51f1c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','INVOICES','715c3796-4640-4be3-ac7f-2e1857cbd23c','CREATE','Invoice \"INV-2026-00002\" issued for order \"ORD-2026-00003\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 17:00:30.332'),('75ab8912-aa2b-44bf-964f-8626da2b7d6d','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','523c2a5e-0717-40ff-bf4a-afe561af6960','UPDATE','Enquiry \"ENQ-2026-00004\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 15:14:43.206'),('75f16b59-1039-4c90-aae8-b9c47a1f2c7f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','d1c1d7ba-a244-4c5b-a692-d469d74866d3','STATUS_CHANGE','Task group \"ZZ Verify Draft Group\" published to the team.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 15:32:14.421'),('778c1437-b8d1-497b-acd9-51eef37adbfe','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','30256856-52ca-4d20-87ab-436d294e18e5','APPROVE','Quotation \"QTN-2026-00005\" (v1) confirmed.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-03 19:47:56.905'),('7911fd47-4407-4a7a-b1ed-77685793bd62','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','d1c1d7ba-a244-4c5b-a692-d469d74866d3','DELETE','Task group \"ZZ Verify Draft Group\" and its 2 task(s) deleted from order \"ORD-2026-00002\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 15:32:14.545'),('7ad42058-ce99-4070-84d0-c260de47a3b0','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','33d94cd5-9353-4de7-b665-3f5a33f3a6f0','UPDATE','Enquiry \"ENQ-2026-00001\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 11:33:08.096'),('7b18b518-9f61-4ce7-98f1-44dff8c5853a','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','d1c1d7ba-a244-4c5b-a692-d469d74866d3','CREATE','Draft task group \"ZZ Verify Draft Group\" with 2 task(s) added to order \"ORD-2026-00002\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 15:32:14.283'),('7cb7804f-1bab-44f7-ae64-021f95284267','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','dd51ff13-a618-4731-bbb3-d04cb1ac2aad','PRINT','Quotation PDF \"QTN-2026-00003-v1.pdf\" downloaded.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 09:44:02.146'),('7f482392-0806-42bd-b23d-6a826abf0706','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','32a4e2fe-1959-4667-9241-45a876c27c2a','STATUS_CHANGE','Quotation \"QTN-2026-00001\" (v1) marked as SENT.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 12:48:55.331'),('80790611-4c93-4d0d-88d0-c430131fe7b2','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','ee24c6d3-51df-4425-8e33-e55ca2bddd1d','STATUS_CHANGE','Task \"hall\" status changed from PENDING to IN_PROGRESS.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 19:10:34.066'),('8115f7fa-ff5a-4898-a286-578c2707f0de','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','24fedfa3-4425-4539-a4d8-153d020cfc0f','UPDATE','Enquiry \"ENQ-2026-00005\" updated.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-03 18:46:58.358'),('81888c44-d332-44ad-99bb-76ddd7f4cd78','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','4d12e238-355e-4bf5-a4ea-6491ae2bdf49','DELETE','Task group \"test\" and its 0 task(s) deleted from order \"ORD-2026-00002\".',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 19:09:52.858'),('81b91f68-a0bf-490f-8fa4-4327c868954c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','4d12e238-355e-4bf5-a4ea-6491ae2bdf49','CREATE','Task group \"test\" added to order \"ORD-2026-00002\".',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 15:11:28.639'),('82509bea-70a6-451a-9ab5-9dd60ad3e151','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','5a3c4615-7a81-4011-a66d-8a8165281d4e','STATUS_CHANGE','Task \"Hall Chair Arrangement\" status changed from PENDING to COMPLETED.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-29 15:03:23.912'),('829a2d94-8dbe-40e7-9de1-fe71f11cdfac','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','143d3964-9456-4b19-8924-0b21c22b9b53','UPDATE','Enquiry \"ENQ-2026-00006\" updated.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-03 19:48:00.576'),('8431bb24-de87-4f63-9330-2df58179057e','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','428a24f0-87f0-4729-b7bc-8631656781a6','STATUS_CHANGE','Enquiry \"ENQ-2026-00002\" status changed from QUOTATION_TO_SHARE to ORDER_CONFIRMED.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 15:21:01.116'),('85943217-8c61-448a-89d6-ae8cfe3d48c9','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-28 15:11:54.467'),('89c34be5-9b6e-444c-b7c8-690ede69e151','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:04:21.044'),('8be32158-ee77-497a-a9b3-e8d6064be75c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','5fb4491e-ba6c-4bea-ab1b-d0968a84102d','APPROVE','Quotation \"QTN-2026-00003\" (v3) approved.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 12:40:55.616'),('8d3e6859-9bac-4c7d-9896-5a73873aa433','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','3f4eac8b-392e-43bf-8137-c99ec3101081','PRINT','Quotation PDF \"QTN-2026-00002-v2.pdf\" downloaded.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 19:10:26.881'),('90e6687a-c762-4dd3-b0f2-1125b03cb36c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-04 14:45:21.362'),('92d0a297-f53c-4e72-8af7-f305d7490c03','65954d03-7a19-44ad-8f9a-2e31bb53abb5','SETTINGS','65954d03-7a19-44ad-8f9a-2e31bb53abb5','UPDATE','Company information updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 18:52:14.943'),('935faf48-2e30-4d7c-91d3-80caed2180c1','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','32a4e2fe-1959-4667-9241-45a876c27c2a','UPDATE','1 sample image(s) added to quotation \"QTN-2026-00001\".',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 19:30:04.758'),('95ba3df2-f60f-49ef-a9cb-e16eae991dd0','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 16:35:21.566'),('96ac4ead-e64b-40f6-a61b-f46b0c76ec16','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ORDERS','d7a5ffba-7b72-40f7-afec-10380a73c7b1','STATUS_CHANGE','Order \"ORD-2026-00002\" status changed from ADVANCE_PENDING to PLANNING.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 20:10:30.457'),('976f39f5-fbbd-48bb-b102-762547789913','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','523c2a5e-0717-40ff-bf4a-afe561af6960','UPDATE','Enquiry \"ENQ-2026-00004\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 17:50:23.166'),('97d6bc8b-310b-4950-b860-cf9991a66b5d','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGOUT',NULL,NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 14:31:08.103'),('98e5a443-4a8d-4fbe-9e2b-85dac6990340','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-31 18:17:25.613'),('98edb433-f87c-4882-94f8-00b5a7d68a82','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:17:23.691'),('99d100db-e1fd-4e0d-9232-77529e2c5cf9','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PAYMENT_TRACKER','92621269-d7c3-4eed-88e0-26790c027c2d','PAYMENT','Collected 680 (ADVANCE) via CASH for order \"ORD-2026-00001\" (receipt RCT-2026-00005).',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-30 16:31:16.549'),('9a89554f-6cdc-401c-94e4-72d4630f828a','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','32a4e2fe-1959-4667-9241-45a876c27c2a','CREATE','Quotation \"QTN-2026-00001\" (v1) created from ENQUIRY.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 19:30:04.669'),('9fc67668-0068-4b4f-a02b-2b37e94a7823','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','5fb4491e-ba6c-4bea-ab1b-d0968a84102d','PRINT','Quotation PDF \"QTN-2026-00003-v3.pdf\" downloaded.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 19:29:01.499'),('a004084c-01f4-4ecc-bc33-60ffedc3c81b','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','32fc5090-b589-474f-9d0b-24fd3532edb4','CREATE','Quotation \"QTN-2026-00001\" (v1) created from ENQUIRY.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 18:34:18.733'),('a0623c82-43fe-41b2-8b58-6d77dfdeeb89','65954d03-7a19-44ad-8f9a-2e31bb53abb5','INVOICES','d7a5ffba-7b72-40f7-afec-10380a73c7b1','CREATE','Invoice \"INV-2026-00001\" issued for order \"ORD-2026-00002\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 17:00:13.259'),('a21c7928-4c24-42be-a664-bc390f1193e5','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','82a65c1e-60c4-4f1b-9a66-920e5f639832','APPROVE','Quotation \"QTN-2026-00004\" (v1) approved.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 17:50:12.525'),('a26c8e62-75ae-49b2-bf2e-72548803b304','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-31 18:12:21.515'),('a32128ca-0b96-447e-93c1-f48a54c1f849','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:38:49.547'),('a4ac4b8f-60cb-405f-851c-d0964dddaa3a','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 14:33:35.411'),('a4bd26ac-fef0-46f2-80b8-34218766feae','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PAYMENT_TRACKER','d7a5ffba-7b72-40f7-afec-10380a73c7b1','PAYMENT','Collected 200 (PARTIAL) via CARD for order \"ORD-2026-00002\" (receipt RCT-2026-00003).',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 16:16:43.920'),('a6592015-3d79-4eca-acc7-0bb6a63fd6f4','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:56:21.923'),('a728b38d-7488-490e-b1d0-bff79bd1690c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','523c2a5e-0717-40ff-bf4a-afe561af6960','CREATE','Enquiry \"ENQ-2026-00004\" created.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 14:39:44.677'),('a8923ee5-cae5-48af-bc50-13063d3f444e','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','30256856-52ca-4d20-87ab-436d294e18e5','CREATE','Quotation \"QTN-2026-00005\" (v1) created from ENQUIRY.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-03 19:47:14.192'),('a982e034-1126-4c33-acbc-4440e4acdcc4','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 14:32:56.006'),('acc460b6-5a53-40a2-a1a9-c540980eae72','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-30 15:02:51.506'),('adfc0b1b-6341-46ad-a19e-2b694edb6a2f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','5fb4491e-ba6c-4bea-ab1b-d0968a84102d','PRINT','Quotation PDF \"QTN-2026-00003-v3.pdf\" downloaded.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-30 19:20:41.412'),('aea45d22-854e-448c-9a32-86837469feb8','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','24fedfa3-4425-4539-a4d8-153d020cfc0f','UPDATE','Enquiry \"ENQ-2026-00005\" updated.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-03 18:53:17.176'),('af0a58ee-aa21-4d88-913e-4b6551420495','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','c4593ff4-5842-4394-87b3-5765b76d7d30','PRINT','Quotation PDF \"QTN-2026-00002-v1.pdf\" downloaded.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 18:48:48.774'),('afc8cf31-98d4-4576-88c5-f84f9351fe36','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PAYMENT_TRACKER','92621269-d7c3-4eed-88e0-26790c027c2d','PAYMENT','Collected 500 (PARTIAL) via UPI for order \"ORD-2026-00001\" (receipt RCT-2026-00008).',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-02 14:13:34.767'),('b1c4dd23-6ada-4f34-828b-cc46e58fdc8f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','5fb4491e-ba6c-4bea-ab1b-d0968a84102d','UPDATE','Quotation \"QTN-2026-00003\" (v3) updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 11:46:52.049'),('b1fa6982-f6bd-4d13-937c-81757b7b68ef','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ORDERS','92621269-d7c3-4eed-88e0-26790c027c2d','STATUS_CHANGE','Order \"ORD-2026-00001\" status changed from ADVANCE_RECEIVED to PLANNING.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-30 19:22:59.632'),('b2640da3-be9f-4af8-9a90-5d84861c168b','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','a7bb6f75-365d-4898-8e9c-c1ddd4a9d364','STATUS_CHANGE','Quotation \"QTN-2026-00002\" (v2) marked as SENT.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:24:44.337'),('b2bac79f-0712-4b69-ae1c-7614160cc153','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','197543ad-2fb5-4fae-9d7e-91f0f8776d4e','DELETE','Task group \"Stage Decoration\" and its 3 task(s) deleted from order \"ORD-2026-00002\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-29 15:18:35.504'),('b46c8101-23f3-45e5-835d-2b65bc39171e','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','0f86fdae-59cb-4508-963f-aec4e4c9cc2e','UPDATE','2 sample image(s) added to quotation \"QTN-2026-00001\".',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 19:14:41.812'),('b4a65dac-3148-425a-844e-bf4f688bf283','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 15:17:52.497'),('b52948bc-2add-48aa-98f8-217ea070d20c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:02:20.825'),('b6f4002b-f2d6-405a-8d5c-b8c601dc7d0b','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PAYMENT_TRACKER','d7a5ffba-7b72-40f7-afec-10380a73c7b1','PAYMENT','Collected 1000 (FINAL) via BANK for order \"ORD-2026-00002\" (receipt RCT-2026-00004).',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 16:16:44.281'),('b74c9539-613a-4b22-9b88-0625e71eea6f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','523c2a5e-0717-40ff-bf4a-afe561af6960','STATUS_CHANGE','Enquiry \"ENQ-2026-00004\" status changed from ORDER_LOST to ORDER_CONFIRMED.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 15:14:40.856'),('b784fd7e-5281-4a2f-b31f-bebb0280dc5c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:17:01.944'),('b8e459f1-0967-48a2-acfc-b5613233e510','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:09:15.936'),('ba74d8f3-fb7d-4dca-a9b2-4673d2c83d43','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:25:40.934'),('baaa205f-5f39-4863-8300-e6b93085f5a2','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-03 16:05:07.468'),('bc756431-1a23-484a-88a4-8a71b1ed8afe','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:25:03.981'),('bd862a2a-3df0-4ddb-b866-5da7ea990516','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-31 18:21:12.807'),('bf0e9f03-5218-427a-aa86-e8669ba79b43','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','c8cc701c-fa33-4348-a5f8-c9c3da6c75ea','CREATE','Quotation \"QTN-2026-00002\" (v1) created from ENQUIRY.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-22 20:04:32.975'),('c0f3bec8-72f1-451b-8191-7526dd6f8f99','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-30 20:37:48.653'),('c1083d9e-30bc-4232-a854-c31a226f5dcd','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','33d94cd5-9353-4de7-b665-3f5a33f3a6f0','STATUS_CHANGE','Enquiry \"ENQ-2026-00001\" status changed from QUOTATION_SHARED to ORDER_CONFIRMED. Remarks: order ok',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-22 20:12:03.059'),('c22bd755-2fe3-40b0-8022-a74b163e64b7','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:06:37.785'),('c2700577-fc53-4215-b951-65ad84c63086','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','82a65c1e-60c4-4f1b-9a66-920e5f639832','APPROVE','Quotation \"QTN-2026-00004\" (v1) approved.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 15:10:14.367'),('c6db31aa-5a84-4e93-bdd4-ff6ca463c6cd','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 14:26:35.729'),('c7887a07-547e-4c37-b01b-ec6b2e6d9556','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','1ac804ee-75d2-499a-abef-e6330643f1cf','CREATE','Quotation \"QTN-2026-00001\" (v1) created from ENQUIRY.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 18:17:35.627'),('c8f95f47-4c97-486d-9fb4-345066da8e90','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PAYMENTS','a56e9466-d2df-429f-9acf-86d1dd0e97dd','CREATE','Payment of 50 (PARTIAL) recorded for order \"ORD-2026-00003\" (receipt RCT-2026-00007).',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 16:36:03.345'),('ca9b9afb-12aa-4815-b48e-bdc872685394','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 14:32:56.443'),('cb7aef51-926d-47e1-b3aa-9a800bfa399c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','3b629d7a-bdfa-4bdf-a61d-2a59f60a102a','CREATE','Quotation \"QTN-2026-00001\" (v1) created from ENQUIRY.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 19:12:06.440'),('cbee1915-e732-448f-86aa-93d8fdebd060','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','82a65c1e-60c4-4f1b-9a66-920e5f639832','STATUS_CHANGE','Quotation \"QTN-2026-00004\" (v1) marked as REJECTED.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 15:09:36.586'),('cd23bc96-df03-40aa-bbde-99d894ede77e','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','33d94cd5-9353-4de7-b665-3f5a33f3a6f0','UPDATE','Enquiry \"ENQ-2026-00001\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 15:16:08.748'),('cd24dba6-18fa-48ec-a2ac-3b4bc76a4e62','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-22 14:28:55.333'),('d01fa0ba-24df-4d7a-a48f-d9adecaa3dbf','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 18:55:45.557'),('d1811806-4109-45d6-b23e-236bfc8e6942','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PAYMENT_TRACKER','715c3796-4640-4be3-ac7f-2e1857cbd23c','PAYMENT','Collected 100 (ADVANCE) via CASH for order \"ORD-2026-00003\" (receipt RCT-2026-00006).',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 16:36:03.183'),('d1ba7365-772d-4020-a2ee-1197f11b81d2','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 18:45:02.467'),('d5dca83a-7496-4ef7-aeb8-4c35f5ee32ad','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','189e9b91-d687-4401-89f4-39cb077889bb','STATUS_CHANGE','Task \"mess\" status changed from PENDING to COMPLETED.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 19:10:18.962'),('d6d93584-cdd2-46fd-98d5-e7c2a3930916','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:33:59.643'),('d7a3974f-1fa2-4f47-9c9d-b8e9fbac477c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','6d090981-e96b-4af3-bb41-5d56780969ff','LOGIN','Smoke User logged in.',NULL,NULL,'2026-07-30 20:39:21.175'),('d7a63fbb-96c3-46b9-9c68-6a1c22b3ad89','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 15:37:17.984'),('d7c17364-2d39-488f-9ae5-2f0a358cf42d','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 18:43:39.152'),('d9fd67c2-7489-4ada-a537-eaf715ce4862','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ORDERS','d7a5ffba-7b72-40f7-afec-10380a73c7b1','STATUS_CHANGE','Order \"ORD-2026-00002\" status changed from CONFIRMED to ADVANCE_PENDING.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:56:26.469'),('db93913b-5d5c-4b46-a2d8-78366ed9f739','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','428a24f0-87f0-4729-b7bc-8631656781a6','UPDATE','Enquiry \"ENQ-2026-00002\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 09:47:03.569'),('dd23202e-648a-47a9-a006-1ed0cda118bf','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','33d94cd5-9353-4de7-b665-3f5a33f3a6f0','STATUS_CHANGE','Enquiry \"ENQ-2026-00001\" status changed from QUOTATION_TO_SHARE to QUOTATION_SHARED. Remarks: test',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-22 20:11:48.206'),('dd5f07e1-fc97-450a-9d74-54e84bf8efc0','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','6d090981-e96b-4af3-bb41-5d56780969ff','LOGIN','Smoke User logged in.',NULL,NULL,'2026-07-30 20:38:53.482'),('dd5f28d6-fa8c-4f6c-a94e-163c3c98dc36','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','c4593ff4-5842-4394-87b3-5765b76d7d30','CREATE','Quotation \"QTN-2026-00002\" (v1) created from ENQUIRY.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 18:48:18.381'),('de134f93-9a43-433a-a9c1-00e4bb5a8fa8','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','7d7f8276-f71e-4666-b8ef-f80b0f4c4d0e','STATUS_CHANGE','Quotation \"QTN-2026-00003\" (v2) marked as SENT.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 15:08:57.014'),('df80abff-f5e7-4851-b660-1e42ed1e1b5c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','USER_GROUPS','a8d1510a-0d15-432e-8e51-85f3e2c19843','UPDATE_PERMISSIONS','Permissions updated for user group \"Event Coordinator\".','[{\"module\":\"CALENDAR\",\"action\":\"canView\"},{\"module\":\"PLANNING\",\"action\":\"canCreate\"},{\"module\":\"PLANNING\",\"action\":\"canEdit\"},{\"module\":\"PLANNING\",\"action\":\"canUpdateChecklist\"},{\"module\":\"PLANNING\",\"action\":\"canView\"}]','516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-31 18:40:53.104'),('e002ac0d-f5b6-4922-8231-70c67eea412c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','f372ed53-94a5-438e-93fd-c59f4f87789f','STATUS_CHANGE','Task \"Verify task A\" status changed from PENDING to COMPLETED.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 15:32:14.507'),('e335bd23-eff1-4115-a60a-8c89ccc4533f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','6c2bec84-748b-452d-a0f0-1f8c5f50fe22','CREATE','Quotation \"QTN-2026-00005\" (v1) created from ENQUIRY.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 18:45:03.037'),('e5328d5a-79e5-4aac-bdb6-dba5d7abb9d7','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','5aef356d-58a0-407a-bdb7-8901168ff78c','CREATE','Quotation \"QTN-2026-00001\" (v1) created from ENQUIRY.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 19:11:13.210'),('e61a76e4-8412-4d0b-8fd6-1fccfe83fc48','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 15:40:25.953'),('e6c65352-db5c-4856-9326-0ce27f7eb7af','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATIONS','5fb4491e-ba6c-4bea-ab1b-d0968a84102d','STATUS_CHANGE','Quotation \"QTN-2026-00003\" (v3) marked as SENT.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 11:48:53.112'),('e8877aee-cce7-4658-8278-ec67bcb12ea6','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','24fedfa3-4425-4539-a4d8-153d020cfc0f','CREATE','Enquiry \"ENQ-2026-00005\" created.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-03 18:39:00.418'),('e93ab0d3-4bbc-4697-ad64-e994776be3b6','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:00:14.418'),('e97a455c-2ba2-45df-9aed-a59e92a58541','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','6d090981-e96b-4af3-bb41-5d56780969ff','LOGIN','Smoke User logged in.',NULL,NULL,'2026-07-30 20:39:44.148'),('e9f19c6a-35d7-40a8-8db1-ace181a75d9e','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ORDERS','715c3796-4640-4be3-ac7f-2e1857cbd23c','STATUS_CHANGE','Order \"ORD-2026-00003\" status changed from IN_PROGRESS to REJECTED. Reason: Rejected from the Orders list.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-02 14:31:23.117'),('eb1d14b8-c994-4e03-ad75-7b1f25044c2c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PAYMENT_TRACKER','92621269-d7c3-4eed-88e0-26790c027c2d','STATUS_CHANGE','Payment status for order \"ORD-2026-00001\" set to ADVANCE_PAID manually.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-30 16:31:16.553'),('eb23de35-1521-44cb-a373-82246c483cf2','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-21 19:13:35.051'),('eb7413bd-87bb-432e-8205-65bab2606493','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','fe6a8293-8f38-4c7b-914f-30b925811528','CREATE','Task group \"Chair Allocation\" with 3 task(s) added to order \"ORD-2026-00002\".',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-29 19:09:31.771'),('ec9603c3-4e75-411b-9d27-8dab806254e0','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','33d94cd5-9353-4de7-b665-3f5a33f3a6f0','STATUS_CHANGE','Enquiry \"ENQ-2026-00001\" status changed from APPOINTMENT_FIXED to QUOTATION_TO_SHARE. Remarks: Quatation want to be share',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 15:16:02.310'),('efd412c9-69af-49f3-8164-4861f07789d8','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','ee24c6d3-51df-4425-8e33-e55ca2bddd1d','STATUS_CHANGE','Task \"hall\" status changed from COMPLETED to PENDING.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-31 19:49:34.351'),('f0aacbc6-f71a-4322-9a4b-6345e254671f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','ee24c6d3-51df-4425-8e33-e55ca2bddd1d','STATUS_CHANGE','Task \"hall\" status changed from IN_PROGRESS to COMPLETED.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-31 19:49:32.674'),('f38e5cce-bb8d-42fc-8a38-a4dc050aa317','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','428a24f0-87f0-4729-b7bc-8631656781a6','UPDATE','Enquiry \"ENQ-2026-00002\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 11:32:41.640'),('f4a977c2-9f26-4bd8-b83f-499239ed2505','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PAYMENT_TRACKER','92621269-d7c3-4eed-88e0-26790c027c2d','STATUS_CHANGE','Payment status for order \"ORD-2026-00001\" set to PARTIAL_PAYMENT manually.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-02 14:13:34.775'),('f700a11f-c395-4824-8d9c-86dbb1ff6a09','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:10:08.693'),('f826cc71-c5eb-4857-baba-9b3691d47ac7','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 15:08:56.985'),('f8e42d10-1790-4cd1-8191-639ca9e4ee2f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','MASTERS','cc5482d7-7829-48f5-9046-fc6a93cdf6e6','CREATE','Event type \"Wedding\" created.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 15:12:53.657'),('fa1d96b2-ee32-4678-8a22-8d1f225d571c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','d4028a53-fd73-485a-bee8-d56514f11b12','LOGIN','Sanju logged in.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 04:00:25.227'),('fa93670b-95af-4a3f-bf7f-5cd0a9c4899f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','428a24f0-87f0-4729-b7bc-8631656781a6','STATUS_CHANGE','Enquiry \"ENQ-2026-00002\" status changed from QUOTATION_SHARED to ORDER_CONFIRMED.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 19:23:02.844'),('fb6bc11e-5de0-4a10-ae14-b60f9aa4de7e','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 20:10:30.342'),('fbc72b8f-d859-4251-8896-fe7dfc025dee','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','523c2a5e-0717-40ff-bf4a-afe561af6960','UPDATE','Enquiry \"ENQ-2026-00004\" updated.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-02 09:19:57.540'),('fcb48b1e-1b73-4d80-b77c-181fa2b162c6','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRIES','8761de4c-5ee4-48bd-928f-ae7461f0c7fb','UPDATE','Enquiry \"ENQ-2026-00003\" updated.',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 07:02:48.750'),('fe284733-9945-4370-b3e4-9ff2be633132','65954d03-7a19-44ad-8f9a-2e31bb53abb5','AUTH','516ad262-38be-4fc6-be4a-a2853132d1bd','LOGIN','Super Admin logged in.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-27 19:36:45.936'),('fe7d1dcd-08bf-491a-b1a3-540ece24d0f6','65954d03-7a19-44ad-8f9a-2e31bb53abb5','PLANNING','d1c1d7ba-a244-4c5b-a692-d469d74866d3','STATUS_CHANGE','Task group \"ZZ Verify Draft Group\" moved back to draft.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 15:32:14.466'),('fff7445e-9e72-4a99-b262-7a21f4ad888a','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ORDERS','715c3796-4640-4be3-ac7f-2e1857cbd23c','STATUS_CHANGE','Order \"ORD-2026-00003\" status changed from CONFIRMED to PLANNING.',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-02 10:03:03.671');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` char(36) NOT NULL,
  `company_name` varchar(191) NOT NULL,
  `contact_person` varchar(191) DEFAULT NULL,
  `mobile` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `logo` varchar(191) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `gst_number` varchar(191) DEFAULT NULL,
  `authorized_signatory` varchar(191) DEFAULT NULL,
  `bank_account_name` varchar(191) DEFAULT NULL,
  `bank_account_number` varchar(191) DEFAULT NULL,
  `bank_branch` varchar(191) DEFAULT NULL,
  `bank_ifsc` varchar(191) DEFAULT NULL,
  `bank_name` varchar(191) DEFAULT NULL,
  `bank_upi` varchar(191) DEFAULT NULL,
  `footer_message` text DEFAULT NULL,
  `website` varchar(191) DEFAULT NULL,
  `terms_and_conditions` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES ('65954d03-7a19-44ad-8f9a-2e31bb53abb5','Sanju Events','Infant','6374917287','sanju@gmail.com','136, Highway Colony ,\nPMM Illam\nSubramaniyapuram\nPonmalai\nTrichy - 621090','company/1784650751474-964959710.jpeg','ACTIVE','2026-07-21 14:54:44.375','2026-07-21 18:52:22.845',NULL,'Sanju','sanjuEvents','4958904579875','Ponmalai','ifsc983d8','IFSC','sanju@upi','Sanju Events',NULL,NULL);
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `customer_code` varchar(191) NOT NULL,
  `customer_name` varchar(191) NOT NULL,
  `mobile` varchar(191) NOT NULL,
  `whatsapp` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_customer_code_key` (`customer_code`),
  KEY `customers_mobile_idx` (`mobile`),
  KEY `customers_customer_name_idx` (`customer_name`),
  KEY `customers_company_id_fkey` (`company_id`),
  KEY `customers_city_idx` (`city`),
  CONSTRAINT `customers_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('106eb945-5447-4c2b-af0f-a21ef6121482','65954d03-7a19-44ad-8f9a-2e31bb53abb5','CUS-2026-00002','meshak','8778467890','8778467890','meshak@gmail.com','Tirunellveli',NULL,'ACTIVE','2026-07-27 15:14:40.848','2026-07-27 15:14:40.848',NULL,'tirunelveli'),('73aba04e-b343-419a-a408-c72c097ad576','65954d03-7a19-44ad-8f9a-2e31bb53abb5','CUS-2026-00003','yugesh','9876788909','87542 67943',NULL,NULL,NULL,'ACTIVE','2026-07-27 15:21:01.107','2026-07-27 15:21:01.107',NULL,NULL),('98fefc76-bd51-4adb-a141-ef8334e17dff','65954d03-7a19-44ad-8f9a-2e31bb53abb5','CUS-2026-00001','simsone','9837876867','9079879879','simsone@gmail.com','Trichy',NULL,'ACTIVE','2026-07-22 20:12:03.043','2026-07-22 20:12:03.043',NULL,'Trichy'),('c5f47dad-ab9a-45f7-b5ee-c57626cae6c8','65954d03-7a19-44ad-8f9a-2e31bb53abb5','CUS-2026-00004','test 1','8674857678','8674857678',NULL,NULL,NULL,'ACTIVE','2026-08-03 18:39:00.400','2026-08-03 18:39:00.400',NULL,'Trichy'),('e45026af-3a5b-4bb2-b6a3-b22b8e6fec43','65954d03-7a19-44ad-8f9a-2e31bb53abb5','CUS-2026-00005','test 2','8758457867','8758457867',NULL,NULL,NULL,'ACTIVE','2026-08-03 19:00:53.551','2026-08-03 19:00:53.551',NULL,'Dindugal');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_sequences`
--

DROP TABLE IF EXISTS `document_sequences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_sequences` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `sequence_type` enum('ENQUIRY','QUOTATION','ORDER','RECEIPT','INVOICE','CUSTOMER') NOT NULL,
  `year` int(11) NOT NULL,
  `last_number` int(11) NOT NULL DEFAULT 0,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `document_sequences_company_id_sequence_type_year_key` (`company_id`,`sequence_type`,`year`),
  CONSTRAINT `document_sequences_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_sequences`
--

LOCK TABLES `document_sequences` WRITE;
/*!40000 ALTER TABLE `document_sequences` DISABLE KEYS */;
INSERT INTO `document_sequences` VALUES ('0da2b19f-d2d4-44c3-8efb-869d228af6f4','65954d03-7a19-44ad-8f9a-2e31bb53abb5','QUOTATION',2026,5,'2026-08-03 19:47:14.028'),('1dcc07d6-d4c8-4d58-8d1a-63061c4a77fd','65954d03-7a19-44ad-8f9a-2e31bb53abb5','CUSTOMER',2026,5,'2026-08-03 19:00:53.546'),('3786432d-2185-4ac2-a4dd-5b0791bfd826','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ORDER',2026,3,'2026-07-27 15:31:00.920'),('6aeba0d9-3181-4360-844e-fb44fa9148da','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQUIRY',2026,6,'2026-08-03 19:00:53.501'),('73e524f0-b18d-46ed-ba48-20e40f3bfd08','65954d03-7a19-44ad-8f9a-2e31bb53abb5','INVOICE',2026,3,'2026-07-30 17:00:30.551'),('788e7acd-b453-46a5-a893-bdddad318696','65954d03-7a19-44ad-8f9a-2e31bb53abb5','RECEIPT',2026,8,'2026-08-02 14:13:34.677');
/*!40000 ALTER TABLE `document_sequences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiries`
--

DROP TABLE IF EXISTS `enquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enquiries` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `enquiry_number` varchar(191) NOT NULL,
  `customer_id` char(36) DEFAULT NULL,
  `event_type_id` char(36) NOT NULL,
  `event_name` varchar(191) DEFAULT NULL,
  `event_date` datetime(3) DEFAULT NULL,
  `mahal` varchar(191) DEFAULT NULL,
  `venue` varchar(191) DEFAULT NULL,
  `estimated_budget` decimal(12,2) DEFAULT NULL,
  `appointment_date` datetime(3) DEFAULT NULL,
  `appointment_time` varchar(191) DEFAULT NULL,
  `appointment_notes` text DEFAULT NULL,
  `assigned_user_id` char(36) DEFAULT NULL,
  `quotation_amount` decimal(12,2) DEFAULT NULL,
  `quotation_version` int(11) DEFAULT NULL,
  `status` enum('PENDING','APPOINTMENT_FIXED','QUOTATION_TO_SHARE','QUOTATION_SHARED','ORDER_CONFIRMED','ORDER_LOST') NOT NULL DEFAULT 'PENDING',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `meeting_location` varchar(191) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `prospect_name` varchar(191) DEFAULT NULL,
  `prospect_mobile` varchar(191) DEFAULT NULL,
  `prospect_whatsapp` varchar(191) DEFAULT NULL,
  `prospect_email` varchar(191) DEFAULT NULL,
  `prospect_address` text DEFAULT NULL,
  `prospect_city` varchar(191) DEFAULT NULL,
  `appointment_status` enum('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `final_budget_amount` decimal(12,2) DEFAULT NULL,
  `advance_amount` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enquiries_enquiry_number_key` (`enquiry_number`),
  KEY `enquiries_event_date_idx` (`event_date`),
  KEY `enquiries_status_idx` (`status`),
  KEY `enquiries_company_id_fkey` (`company_id`),
  KEY `enquiries_event_type_id_fkey` (`event_type_id`),
  KEY `enquiries_assigned_user_id_fkey` (`assigned_user_id`),
  KEY `enquiries_customer_id_fkey` (`customer_id`),
  CONSTRAINT `enquiries_assigned_user_id_fkey` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `enquiries_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `enquiries_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `enquiries_event_type_id_fkey` FOREIGN KEY (`event_type_id`) REFERENCES `event_types` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiries`
--

LOCK TABLES `enquiries` WRITE;
/*!40000 ALTER TABLE `enquiries` DISABLE KEYS */;
INSERT INTO `enquiries` VALUES ('143d3964-9456-4b19-8924-0b21c22b9b53','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQ-2026-00006','e45026af-3a5b-4bb2-b6a3-b22b8e6fec43','233c8bdf-6178-4fa6-b997-4e3c2a786169',NULL,'2026-08-08 00:00:00.000','House','Dindugal',50000.00,NULL,NULL,NULL,NULL,44000.00,1,'ORDER_CONFIRMED','2026-08-03 19:00:53.561','2026-08-03 19:48:00.528',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',44000.00,NULL),('24fedfa3-4425-4539-a4d8-153d020cfc0f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQ-2026-00005','c5f47dad-ab9a-45f7-b5ee-c57626cae6c8','cc5482d7-7829-48f5-9046-fc6a93cdf6e6',NULL,'2026-08-11 00:00:00.000','Yamini mahal','Trichy',200000.00,NULL,NULL,NULL,NULL,NULL,NULL,'ORDER_CONFIRMED','2026-08-03 18:39:00.410','2026-08-03 18:53:17.127',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',100000.00,50000.00),('33d94cd5-9353-4de7-b665-3f5a33f3a6f0','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQ-2026-00001','98fefc76-bd51-4adb-a141-ef8334e17dff','cc5482d7-7829-48f5-9046-fc6a93cdf6e6','Wedding','2026-07-31 00:00:00.000','Raja Mahal','Trichy',400000.00,'2026-07-22 00:00:00.000','03:15 PM',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12',1680.00,1,'ORDER_CONFIRMED','2026-07-21 15:15:20.160','2026-07-24 12:49:07.691',NULL,'junction','test','simsone','9837876867','9079879879','simsone@gmail.com','Trichy','Trichy','COMPLETED',NULL,NULL),('428a24f0-87f0-4729-b7bc-8631656781a6','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQ-2026-00002','73aba04e-b343-419a-a408-c72c097ad576','233c8bdf-6178-4fa6-b997-4e3c2a786169',NULL,'2026-07-31 00:00:00.000',NULL,NULL,49999.00,'2026-07-24 00:00:00.000','12:00 PM',NULL,NULL,560.00,2,'ORDER_CONFIRMED','2026-07-22 20:04:32.768','2026-07-27 19:23:05.242',NULL,'Trichy',NULL,'yugesh','9876788909','87542 67943',NULL,NULL,NULL,'COMPLETED',560.00,NULL),('523c2a5e-0717-40ff-bf4a-afe561af6960','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQ-2026-00004','106eb945-5447-4c2b-af0f-a21ef6121482','cc5482d7-7829-48f5-9046-fc6a93cdf6e6',NULL,'2026-08-03 00:00:00.000','Raja mahal','Tirunelveli',200000.00,'2026-07-29 00:00:00.000','03:20 PM',NULL,'d4028a53-fd73-485a-bee8-d56514f11b12',12896.00,1,'ORDER_CONFIRMED','2026-07-27 14:39:44.662','2026-08-02 09:19:57.533',NULL,'Madurai','followup needed','meshak','8778467890','8778467890','meshak@gmail.com','Tirunellveli','tirunelveli','COMPLETED',12896.00,NULL),('8761de4c-5ee4-48bd-928f-ae7461f0c7fb','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ENQ-2026-00003','98fefc76-bd51-4adb-a141-ef8334e17dff','cc5482d7-7829-48f5-9046-fc6a93cdf6e6',NULL,'2026-07-31 00:00:00.000','Royal Palace','Trichy',400000.00,'2026-07-27 00:00:00.000','12:20 AM','testing discussion','d4028a53-fd73-485a-bee8-d56514f11b12',918.00,3,'QUOTATION_SHARED','2026-07-24 04:35:52.423','2026-08-02 14:16:48.172',NULL,'Thillai nagar','test notes',NULL,NULL,NULL,NULL,NULL,NULL,'IN_PROGRESS',NULL,NULL);
/*!40000 ALTER TABLE `enquiries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_followups`
--

DROP TABLE IF EXISTS `enquiry_followups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enquiry_followups` (
  `id` char(36) NOT NULL,
  `enquiry_id` char(36) NOT NULL,
  `follow_up_date` datetime(3) NOT NULL,
  `notes` text DEFAULT NULL,
  `outcome` varchar(191) DEFAULT NULL,
  `created_by_id` char(36) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `enquiry_followups_enquiry_id_fkey` (`enquiry_id`),
  KEY `enquiry_followups_created_by_id_fkey` (`created_by_id`),
  CONSTRAINT `enquiry_followups_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `enquiry_followups_enquiry_id_fkey` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_followups`
--

LOCK TABLES `enquiry_followups` WRITE;
/*!40000 ALTER TABLE `enquiry_followups` DISABLE KEYS */;
/*!40000 ALTER TABLE `enquiry_followups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_types`
--

DROP TABLE IF EXISTS `event_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_types` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `event_name` varchar(191) NOT NULL,
  `color_code` varchar(191) DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_types_company_id_event_name_key` (`company_id`,`event_name`),
  CONSTRAINT `event_types_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_types`
--

LOCK TABLES `event_types` WRITE;
/*!40000 ALTER TABLE `event_types` DISABLE KEYS */;
INSERT INTO `event_types` VALUES ('233c8bdf-6178-4fa6-b997-4e3c2a786169','65954d03-7a19-44ad-8f9a-2e31bb53abb5','Birth Day','brown',2,'ACTIVE','2026-07-21 15:13:20.121','2026-07-28 16:27:33.489',NULL),('cc5482d7-7829-48f5-9046-fc6a93cdf6e6','65954d03-7a19-44ad-8f9a-2e31bb53abb5','Wedding','orange',1,'ACTIVE','2026-07-21 15:12:53.651','2026-07-28 16:27:20.323',NULL);
/*!40000 ALTER TABLE `event_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `invoice_number` varchar(191) NOT NULL,
  `invoice_date` datetime(3) NOT NULL,
  `issued_by_id` char(36) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_order_id_key` (`order_id`),
  UNIQUE KEY `invoices_invoice_number_key` (`invoice_number`),
  KEY `invoices_company_id_fkey` (`company_id`),
  KEY `invoices_issued_by_id_fkey` (`issued_by_id`),
  CONSTRAINT `invoices_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_issued_by_id_fkey` FOREIGN KEY (`issued_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoices_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES ('2c9a3db5-dd29-49f8-9655-afc4a659ee59','65954d03-7a19-44ad-8f9a-2e31bb53abb5','d7a5ffba-7b72-40f7-afec-10380a73c7b1','INV-2026-00001','2026-07-30 17:00:13.249','516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 17:00:13.253','2026-07-30 17:00:13.253',NULL),('6e7b4630-1777-4d70-abaf-d83beba6801c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','715c3796-4640-4be3-ac7f-2e1857cbd23c','INV-2026-00002','2026-07-30 17:00:30.321','516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 17:00:30.324','2026-07-30 17:00:30.324',NULL),('71764688-e355-42b1-a596-4af4babca12c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','92621269-d7c3-4eed-88e0-26790c027c2d','INV-2026-00003','2026-07-30 17:00:30.553','516ad262-38be-4fc6-be4a-a2853132d1bd','2026-07-30 17:00:30.557','2026-07-30 17:00:30.557',NULL);
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_documents`
--

DROP TABLE IF EXISTS `order_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_documents` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `document_type` enum('QUOTATION_PDF','RECEIPT','AGREEMENT','EVENT_PHOTO','OTHER') NOT NULL,
  `file_name` varchar(191) NOT NULL,
  `file_path` varchar(191) NOT NULL,
  `uploaded_by_id` char(36) DEFAULT NULL,
  `uploaded_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_documents_order_id_fkey` (`order_id`),
  KEY `order_documents_uploaded_by_id_fkey` (`uploaded_by_id`),
  CONSTRAINT `order_documents_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `order_documents_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_documents`
--

LOCK TABLES `order_documents` WRITE;
/*!40000 ALTER TABLE `order_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_tasks`
--

DROP TABLE IF EXISTS `order_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_tasks` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `task_name` varchar(191) NOT NULL,
  `task_category` enum('PLANNING','EXECUTION') NOT NULL,
  `assigned_to_id` char(36) DEFAULT NULL,
  `due_date` datetime(3) DEFAULT NULL,
  `completed_date` datetime(3) DEFAULT NULL,
  `completed_by_id` char(36) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','SKIPPED') NOT NULL DEFAULT 'PENDING',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_tasks_order_id_fkey` (`order_id`),
  KEY `order_tasks_assigned_to_id_fkey` (`assigned_to_id`),
  KEY `order_tasks_completed_by_id_fkey` (`completed_by_id`),
  CONSTRAINT `order_tasks_assigned_to_id_fkey` FOREIGN KEY (`assigned_to_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `order_tasks_completed_by_id_fkey` FOREIGN KEY (`completed_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `order_tasks_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_tasks`
--

LOCK TABLES `order_tasks` WRITE;
/*!40000 ALTER TABLE `order_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `order_number` varchar(191) NOT NULL,
  `enquiry_id` char(36) NOT NULL,
  `quotation_id` char(36) NOT NULL,
  `customer_id` char(36) NOT NULL,
  `event_date` datetime(3) NOT NULL,
  `venue` varchar(191) DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `paid_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `pending_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `coordinator_id` char(36) DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `status` enum('YET_TO_START','IN_PROGRESS','ORDER_CLOSED','REJECTED') NOT NULL DEFAULT 'YET_TO_START',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_number_key` (`order_number`),
  KEY `orders_event_date_idx` (`event_date`),
  KEY `orders_status_idx` (`status`),
  KEY `orders_company_id_fkey` (`company_id`),
  KEY `orders_enquiry_id_fkey` (`enquiry_id`),
  KEY `orders_quotation_id_fkey` (`quotation_id`),
  KEY `orders_customer_id_fkey` (`customer_id`),
  KEY `orders_coordinator_id_fkey` (`coordinator_id`),
  CONSTRAINT `orders_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `orders_coordinator_id_fkey` FOREIGN KEY (`coordinator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `orders_enquiry_id_fkey` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `orders_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES ('715c3796-4640-4be3-ac7f-2e1857cbd23c','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ORD-2026-00003','523c2a5e-0717-40ff-bf4a-afe561af6960','82a65c1e-60c4-4f1b-9a66-920e5f639832','106eb945-5447-4c2b-af0f-a21ef6121482','2026-08-03 00:00:00.000','Tirunelveli',12896.00,150.00,12746.00,NULL,'Rejected from the Orders list.','REJECTED','2026-07-27 15:31:00.925','2026-08-02 14:31:23.055',NULL,'followup needed',NULL),('92621269-d7c3-4eed-88e0-26790c027c2d','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ORD-2026-00001','33d94cd5-9353-4de7-b665-3f5a33f3a6f0','32a4e2fe-1959-4667-9241-45a876c27c2a','98fefc76-bd51-4adb-a141-ef8334e17dff','2026-07-31 00:00:00.000','Trichy',1680.00,1180.00,500.00,NULL,NULL,'IN_PROGRESS','2026-07-24 13:05:01.022','2026-08-02 14:13:34.732',NULL,'test',NULL),('d7a5ffba-7b72-40f7-afec-10380a73c7b1','65954d03-7a19-44ad-8f9a-2e31bb53abb5','ORD-2026-00002','428a24f0-87f0-4729-b7bc-8631656781a6','a7bb6f75-365d-4898-8e9c-c1ddd4a9d364','73aba04e-b343-419a-a408-c72c097ad576','2026-07-31 00:00:00.000',NULL,2000.00,2000.00,0.00,NULL,NULL,'ORDER_CLOSED','2026-07-27 15:21:01.129','2026-08-02 12:57:15.047',NULL,NULL,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_trackers`
--

DROP TABLE IF EXISTS `payment_trackers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_trackers` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `payment_status` enum('PENDING','ADVANCE_PAID','PARTIAL_PAYMENT','FULLY_PAID') NOT NULL DEFAULT 'PENDING',
  `status_manual` tinyint(1) NOT NULL DEFAULT 0,
  `remarks` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_trackers_order_id_key` (`order_id`),
  KEY `payment_trackers_payment_status_idx` (`payment_status`),
  CONSTRAINT `payment_trackers_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_trackers`
--

LOCK TABLES `payment_trackers` WRITE;
/*!40000 ALTER TABLE `payment_trackers` DISABLE KEYS */;
INSERT INTO `payment_trackers` VALUES ('38831abf-8c30-11f1-a799-9cc7d31fd403','715c3796-4640-4be3-ac7f-2e1857cbd23c','PARTIAL_PAYMENT',0,NULL,'2026-07-30 21:33:35.958','2026-07-30 16:36:03.341',NULL),('38831bed-8c30-11f1-a799-9cc7d31fd403','92621269-d7c3-4eed-88e0-26790c027c2d','PARTIAL_PAYMENT',1,'Partial amount \ncollected','2026-07-30 21:33:35.958','2026-08-02 14:13:34.763',NULL),('38831c4e-8c30-11f1-a799-9cc7d31fd403','d7a5ffba-7b72-40f7-afec-10380a73c7b1','FULLY_PAID',0,'Advance received at venue visit.','2026-07-30 21:33:35.958','2026-07-30 16:16:44.276',NULL);
/*!40000 ALTER TABLE `payment_trackers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `payment_date` datetime(3) NOT NULL,
  `payment_type` enum('ADVANCE','PARTIAL','FINAL') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('CASH','UPI','BANK','CARD','CHEQUE') NOT NULL,
  `reference_number` varchar(191) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `received_by_id` char(36) DEFAULT NULL,
  `receipt_number` varchar(191) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_receipt_number_key` (`receipt_number`),
  KEY `payments_payment_date_idx` (`payment_date`),
  KEY `payments_order_id_fkey` (`order_id`),
  KEY `payments_received_by_id_fkey` (`received_by_id`),
  CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `payments_received_by_id_fkey` FOREIGN KEY (`received_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES ('32fd537b-19b7-4f9f-93c3-d74433908b9f','d7a5ffba-7b72-40f7-afec-10380a73c7b1','2026-07-30 16:16:26.671','ADVANCE',500.00,'UPI','UPI-9911',NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','RCT-2026-00001','2026-07-30 16:16:26.676',NULL),('6780cdc2-5021-4271-a134-abc3e6b1a24d','92621269-d7c3-4eed-88e0-26790c027c2d','2026-08-01 00:00:00.000','PARTIAL',500.00,'UPI',NULL,NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','RCT-2026-00008','2026-08-02 14:13:34.747',NULL),('9a6143f8-e180-4beb-827e-6eb83359eb71','d7a5ffba-7b72-40f7-afec-10380a73c7b1','2026-07-30 16:16:43.273','PARTIAL',300.00,'CASH',NULL,NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','RCT-2026-00002','2026-07-30 16:16:43.278',NULL),('a1e3152b-4f43-47ee-ae37-28448dac9fd6','92621269-d7c3-4eed-88e0-26790c027c2d','2026-07-29 00:00:00.000','ADVANCE',680.00,'CASH',NULL,NULL,'d4028a53-fd73-485a-bee8-d56514f11b12','RCT-2026-00005','2026-07-30 16:31:16.533',NULL),('a56e9466-d2df-429f-9acf-86d1dd0e97dd','715c3796-4640-4be3-ac7f-2e1857cbd23c','2026-07-30 16:36:03.335','PARTIAL',50.00,'UPI',NULL,NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','RCT-2026-00007','2026-07-30 16:36:03.337',NULL),('c6668586-d660-43e9-8498-b477707ebaf4','715c3796-4640-4be3-ac7f-2e1857cbd23c','2026-07-30 16:36:03.162','ADVANCE',100.00,'CASH',NULL,NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','RCT-2026-00006','2026-07-30 16:36:03.164',NULL),('e60ae846-9f8d-4fd3-bb67-77df683c8f61','d7a5ffba-7b72-40f7-afec-10380a73c7b1','2026-07-30 16:16:43.912','PARTIAL',200.00,'CARD',NULL,NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','RCT-2026-00003','2026-07-30 16:16:43.914',NULL),('ea141882-f748-4725-948f-b3e0dde98c6d','d7a5ffba-7b72-40f7-afec-10380a73c7b1','2026-07-30 16:16:44.270','FINAL',1000.00,'BANK',NULL,NULL,'516ad262-38be-4fc6-be4a-a2853132d1bd','RCT-2026-00004','2026-07-30 16:16:44.272',NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotation_images`
--

DROP TABLE IF EXISTS `quotation_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotation_images` (
  `id` char(36) NOT NULL,
  `quotation_id` char(36) NOT NULL,
  `file_name` varchar(191) NOT NULL,
  `file_path` varchar(191) NOT NULL,
  `caption` varchar(191) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_images_quotation_id_idx` (`quotation_id`),
  CONSTRAINT `quotation_images_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotation_images`
--

LOCK TABLES `quotation_images` WRITE;
/*!40000 ALTER TABLE `quotation_images` DISABLE KEYS */;
INSERT INTO `quotation_images` VALUES ('1b28b023-a6e2-4eac-b84e-d66cfca340fe','32a4e2fe-1959-4667-9241-45a876c27c2a','decor 1.jpg','quotation-images/1784662204699-199615972.jpg',NULL,0,'2026-07-21 19:30:04.711',NULL),('5e7e1097-a9a1-4fd9-a06b-a48eb1c29270','dd51ff13-a618-4731-bbb3-d04cb1ac2aad','decor 1.jpg','quotation-images/1784886230101-12246829.jpg',NULL,0,'2026-07-24 09:43:50.112',NULL),('d054a801-2fda-48f6-a826-26044995942f','f36a56b0-6321-4c91-98d4-a17db1681b71','decor 1.jpg','quotation-images/1785163272521-759917745.jpg',NULL,0,'2026-07-27 14:41:12.534',NULL);
/*!40000 ALTER TABLE `quotation_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotation_items`
--

DROP TABLE IF EXISTS `quotation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotation_items` (
  `id` char(36) NOT NULL,
  `quotation_id` char(36) NOT NULL,
  `item_name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(191) DEFAULT NULL,
  `rate` decimal(12,2) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `quotation_items_quotation_id_fkey` (`quotation_id`),
  CONSTRAINT `quotation_items_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotation_items`
--

LOCK TABLES `quotation_items` WRITE;
/*!40000 ALTER TABLE `quotation_items` DISABLE KEYS */;
INSERT INTO `quotation_items` VALUES ('0723854c-de61-444c-8e20-6b7123a36a86','c8cc701c-fa33-4348-a5f8-c9c3da6c75ea','chair',NULL,5.00,NULL,90.00,450.00,0),('0a1d8165-32d3-42ea-b318-776d81baaa03','32a4e2fe-1959-4667-9241-45a876c27c2a','Sheet',NULL,3.00,NULL,400.00,1200.00,1),('11f40348-ee21-44b3-9471-11c0d4dcadc3','7d7f8276-f71e-4666-b8ef-f80b0f4c4d0e','Flower Creen',NULL,3.00,NULL,500.00,1500.00,1),('2bcb0a66-41a5-4d38-8788-aa2e5b9477cf','5fb4491e-ba6c-4bea-ab1b-d0968a84102d','bANNER',NULL,4.00,NULL,200.00,800.00,1),('37208d16-7f76-4b00-b272-defc8efa94a4','a7bb6f75-365d-4898-8e9c-c1ddd4a9d364','Chairs',NULL,12.00,NULL,30.00,360.00,0),('48091e53-ecc8-4803-a517-1106ca0e6eff','32a4e2fe-1959-4667-9241-45a876c27c2a','Chairs',NULL,10.00,NULL,20.00,200.00,0),('61d04edb-46f4-4294-89b3-740905e89fd7','82a65c1e-60c4-4f1b-9a66-920e5f639832','Chair',NULL,40.00,NULL,50.00,2000.00,1),('69d5a6e8-0f71-4ee5-99d8-29d94c5c2cbf','a7bb6f75-365d-4898-8e9c-c1ddd4a9d364','tables',NULL,5.00,NULL,40.00,200.00,1),('6d5b863c-edf4-4f3a-8009-8424a98eebd0','dd51ff13-a618-4731-bbb3-d04cb1ac2aad','sheet',NULL,4.00,NULL,500.00,2000.00,1),('7082caa0-25f5-49ec-a07f-0d1ecb5ad4fd','f36a56b0-6321-4c91-98d4-a17db1681b71','Travel',NULL,1.00,NULL,10000.00,10000.00,0),('7296ee48-1185-4419-8ac0-e1c4a9b78c4d','dd51ff13-a618-4731-bbb3-d04cb1ac2aad','drum',NULL,3.00,NULL,199.00,597.00,2),('7a2b1bab-34fe-420f-b346-8d247f7b9dd5','dd51ff13-a618-4731-bbb3-d04cb1ac2aad','chair',NULL,5.00,NULL,400.00,2000.00,0),('82b3e5a3-89f9-44e8-80af-564c561bd754','5fb4491e-ba6c-4bea-ab1b-d0968a84102d','Stand',NULL,2.00,NULL,50.00,100.00,0),('bbe2c99b-2adb-4fcf-b118-31d1f3867356','30256856-52ca-4d20-87ab-436d294e18e5','test',NULL,1.00,NULL,40000.00,40000.00,0),('c1055566-d642-4668-a327-d7ab034292bc','7d7f8276-f71e-4666-b8ef-f80b0f4c4d0e','chair',NULL,20.00,NULL,40.00,800.00,0),('c9b47ed2-3a5c-4c12-acd6-db785af995fb','82a65c1e-60c4-4f1b-9a66-920e5f639832','Sheet',NULL,4.00,NULL,100.00,400.00,2),('d5912603-40de-45b9-8edc-3876b9fb9341','f36a56b0-6321-4c91-98d4-a17db1681b71','chair',NULL,20.00,NULL,40.00,800.00,1),('e989357b-0aee-43e4-a34b-ee7a85d0f13a','82a65c1e-60c4-4f1b-9a66-920e5f639832','Travel Expense',NULL,1.00,NULL,10000.00,10000.00,0);
/*!40000 ALTER TABLE `quotation_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotations`
--

DROP TABLE IF EXISTS `quotations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotations` (
  `id` char(36) NOT NULL,
  `enquiry_id` char(36) DEFAULT NULL,
  `quotation_number` varchar(191) NOT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `quotation_date` datetime(3) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(12,2) NOT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('DRAFT','SENT','APPROVED','REJECTED','REVISED') NOT NULL DEFAULT 'DRAFT',
  `pdf_path` varchar(191) DEFAULT NULL,
  `created_by_id` char(36) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `company_id` char(36) NOT NULL,
  `customer_id` char(36) DEFAULT NULL,
  `manual_address` text DEFAULT NULL,
  `manual_customer_name` varchar(191) DEFAULT NULL,
  `manual_email` varchar(191) DEFAULT NULL,
  `manual_gst` varchar(191) DEFAULT NULL,
  `manual_phone` varchar(191) DEFAULT NULL,
  `manual_whatsapp` varchar(191) DEFAULT NULL,
  `order_id` char(36) DEFAULT NULL,
  `source` enum('ENQUIRY','CUSTOMER','ORDER','MANUAL') NOT NULL DEFAULT 'ENQUIRY',
  `cgst_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `sgst_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quotations_enquiry_id_version_key` (`enquiry_id`,`version`),
  KEY `quotations_quotation_number_idx` (`quotation_number`),
  KEY `quotations_created_by_id_fkey` (`created_by_id`),
  KEY `quotations_company_id_idx` (`company_id`),
  KEY `quotations_customer_id_fkey` (`customer_id`),
  KEY `quotations_order_id_fkey` (`order_id`),
  CONSTRAINT `quotations_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `quotations_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_enquiry_id_fkey` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotations`
--

LOCK TABLES `quotations` WRITE;
/*!40000 ALTER TABLE `quotations` DISABLE KEYS */;
INSERT INTO `quotations` VALUES ('30256856-52ca-4d20-87ab-436d294e18e5','143d3964-9456-4b19-8924-0b21c22b9b53','QTN-2026-00005',1,'2026-08-03 00:00:00.000',40000.00,0.00,4000.00,44000.00,NULL,'APPROVED','quotations/30256856-52ca-4d20-87ab-436d294e18e5.pdf','516ad262-38be-4fc6-be4a-a2853132d1bd','2026-08-03 19:47:14.078','2026-08-03 19:47:56.858',NULL,'65954d03-7a19-44ad-8f9a-2e31bb53abb5',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ENQUIRY',5.00,5.00),('32a4e2fe-1959-4667-9241-45a876c27c2a','33d94cd5-9353-4de7-b665-3f5a33f3a6f0','QTN-2026-00001',1,'2026-07-21 00:00:00.000',1400.00,0.00,280.00,1680.00,NULL,'APPROVED','quotations/32a4e2fe-1959-4667-9241-45a876c27c2a.pdf','d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-21 19:30:04.543','2026-07-24 12:48:59.994',NULL,'65954d03-7a19-44ad-8f9a-2e31bb53abb5',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ENQUIRY',10.00,10.00),('5fb4491e-ba6c-4bea-ab1b-d0968a84102d','8761de4c-5ee4-48bd-928f-ae7461f0c7fb','QTN-2026-00003',3,'2026-07-24 00:00:00.000',900.00,0.00,18.00,918.00,NULL,'APPROVED','quotations/5fb4491e-ba6c-4bea-ab1b-d0968a84102d.pdf','d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 11:44:57.452','2026-07-24 12:40:55.567',NULL,'65954d03-7a19-44ad-8f9a-2e31bb53abb5',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ENQUIRY',1.00,1.00),('7d7f8276-f71e-4666-b8ef-f80b0f4c4d0e','8761de4c-5ee4-48bd-928f-ae7461f0c7fb','QTN-2026-00003',2,'2026-07-24 00:00:00.000',2300.00,0.00,0.00,2300.00,NULL,'SENT','quotations/7d7f8276-f71e-4666-b8ef-f80b0f4c4d0e.pdf','d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 10:21:32.686','2026-07-27 15:08:57.007',NULL,'65954d03-7a19-44ad-8f9a-2e31bb53abb5',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ENQUIRY',0.00,0.00),('82a65c1e-60c4-4f1b-9a66-920e5f639832','523c2a5e-0717-40ff-bf4a-afe561af6960','QTN-2026-00004',1,'2026-07-27 14:39:44.720',12400.00,0.00,496.00,12896.00,NULL,'APPROVED','quotations/82a65c1e-60c4-4f1b-9a66-920e5f639832.pdf','d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 14:39:44.722','2026-07-29 17:50:12.468',NULL,'65954d03-7a19-44ad-8f9a-2e31bb53abb5',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ENQUIRY',2.00,2.00),('a7bb6f75-365d-4898-8e9c-c1ddd4a9d364','428a24f0-87f0-4729-b7bc-8631656781a6','QTN-2026-00002',2,'2026-07-24 00:00:00.000',560.00,0.00,0.00,560.00,NULL,'APPROVED','quotations/a7bb6f75-365d-4898-8e9c-c1ddd4a9d364.pdf','d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 11:33:59.907','2026-07-27 19:22:46.727',NULL,'65954d03-7a19-44ad-8f9a-2e31bb53abb5',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ENQUIRY',0.00,0.00),('c8cc701c-fa33-4348-a5f8-c9c3da6c75ea','428a24f0-87f0-4729-b7bc-8631656781a6','QTN-2026-00002',1,'2026-07-22 20:04:32.817',450.00,0.00,18.00,468.00,NULL,'SENT','quotations/c8cc701c-fa33-4348-a5f8-c9c3da6c75ea.pdf','d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-22 20:04:32.821','2026-07-27 19:22:14.616',NULL,'65954d03-7a19-44ad-8f9a-2e31bb53abb5',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ENQUIRY',2.00,2.00),('dd51ff13-a618-4731-bbb3-d04cb1ac2aad','8761de4c-5ee4-48bd-928f-ae7461f0c7fb','QTN-2026-00003',1,'2026-07-24 00:00:00.000',4597.00,0.00,919.40,5516.40,NULL,'REVISED','quotations/dd51ff13-a618-4731-bbb3-d04cb1ac2aad.pdf','d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-24 09:43:49.923','2026-07-24 10:21:32.677',NULL,'65954d03-7a19-44ad-8f9a-2e31bb53abb5',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ENQUIRY',10.00,10.00),('f36a56b0-6321-4c91-98d4-a17db1681b71','523c2a5e-0717-40ff-bf4a-afe561af6960','QTN-2026-00004',2,'2026-07-27 00:00:00.000',10800.00,0.00,0.00,10800.00,NULL,'SENT','quotations/f36a56b0-6321-4c91-98d4-a17db1681b71.pdf','d4028a53-fd73-485a-bee8-d56514f11b12','2026-07-27 14:41:12.400','2026-07-27 14:42:45.903',NULL,'65954d03-7a19-44ad-8f9a-2e31bb53abb5',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ENQUIRY',0.00,0.00);
/*!40000 ALTER TABLE `quotations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_groups`
--

DROP TABLE IF EXISTS `task_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_groups` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `status` enum('DRAFT','PUBLISHED') NOT NULL DEFAULT 'PUBLISHED',
  PRIMARY KEY (`id`),
  KEY `task_groups_order_id_display_order_idx` (`order_id`,`display_order`),
  CONSTRAINT `task_groups_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_groups`
--

LOCK TABLES `task_groups` WRITE;
/*!40000 ALTER TABLE `task_groups` DISABLE KEYS */;
INSERT INTO `task_groups` VALUES ('06990651-b80b-4b3a-9cfb-03e83d8232fb','d7a5ffba-7b72-40f7-afec-10380a73c7b1','Stage decor',NULL,5,'2026-07-30 15:11:16.338','2026-07-30 15:11:16.338',NULL,'PUBLISHED'),('08e5bd93-c6fa-4013-935e-318bbb10b9dc','d7a5ffba-7b72-40f7-afec-10380a73c7b1','ZZ Verify Published Group',NULL,7,'2026-07-30 15:32:14.312','2026-07-30 15:32:14.559','2026-07-30 15:32:14.556','PUBLISHED'),('197543ad-2fb5-4fae-9d7e-91f0f8776d4e','d7a5ffba-7b72-40f7-afec-10380a73c7b1','Stage Decoration','Main stage',2,'2026-07-29 15:18:24.861','2026-07-29 15:18:35.501','2026-07-29 15:18:35.496','PUBLISHED'),('3a739d5a-8253-469a-94ea-1f8b0a4a146c','d7a5ffba-7b72-40f7-afec-10380a73c7b1','Chair Allocation','Hall and stage seating',0,'2026-07-29 15:03:23.263','2026-07-29 15:04:00.604','2026-07-29 15:04:00.587','PUBLISHED'),('4d12e238-355e-4bf5-a4ea-6491ae2bdf49','d7a5ffba-7b72-40f7-afec-10380a73c7b1','test',NULL,1,'2026-07-29 15:11:28.619','2026-07-29 19:09:52.852','2026-07-29 19:09:52.848','PUBLISHED'),('4ee97f25-0387-4603-b3b4-94def432ee43','d7a5ffba-7b72-40f7-afec-10380a73c7b1','Cleaning',NULL,3,'2026-07-29 15:18:25.031','2026-07-29 15:18:35.584','2026-07-29 15:18:35.582','PUBLISHED'),('d1c1d7ba-a244-4c5b-a692-d469d74866d3','d7a5ffba-7b72-40f7-afec-10380a73c7b1','ZZ Verify Draft Group',NULL,6,'2026-07-30 15:32:14.274','2026-07-30 15:32:14.541','2026-07-30 15:32:14.537','PUBLISHED'),('fe6a8293-8f38-4c7b-914f-30b925811528','d7a5ffba-7b72-40f7-afec-10380a73c7b1','Chair Allocation',NULL,4,'2026-07-29 19:09:31.713','2026-07-29 19:09:31.713',NULL,'PUBLISHED');
/*!40000 ALTER TABLE `task_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_items`
--

DROP TABLE IF EXISTS `task_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_items` (
  `id` char(36) NOT NULL,
  `task_group_id` char(36) NOT NULL,
  `task_name` varchar(191) NOT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'PENDING',
  `remarks` text DEFAULT NULL,
  `photo_path` varchar(191) DEFAULT NULL,
  `completed_at` datetime(3) DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `task_items_task_group_id_display_order_idx` (`task_group_id`,`display_order`),
  CONSTRAINT `task_items_task_group_id_fkey` FOREIGN KEY (`task_group_id`) REFERENCES `task_groups` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_items`
--

LOCK TABLES `task_items` WRITE;
/*!40000 ALTER TABLE `task_items` DISABLE KEYS */;
INSERT INTO `task_items` VALUES ('189e9b91-d687-4401-89f4-39cb077889bb','fe6a8293-8f38-4c7b-914f-30b925811528','mess','PENDING',NULL,NULL,NULL,2,'2026-07-29 19:09:31.713','2026-07-29 19:10:19.721',NULL),('1dd0e8c8-ad73-47cc-91c2-a2a0f1f5550d','d1c1d7ba-a244-4c5b-a692-d469d74866d3','Verify task B','PENDING',NULL,NULL,NULL,1,'2026-07-30 15:32:14.274','2026-07-30 15:32:14.540','2026-07-30 15:32:14.537'),('5a3c4615-7a81-4011-a66d-8a8165281d4e','3a739d5a-8253-469a-94ea-1f8b0a4a146c','Hall Chair Arrangement','PENDING',NULL,'task-photos/1785337423234-615828388.png',NULL,0,'2026-07-29 15:03:23.543','2026-07-29 15:04:00.602','2026-07-29 15:04:00.587'),('c8824d1a-3eae-45c6-a84a-a5ae694c3570','3a739d5a-8253-469a-94ea-1f8b0a4a146c','VIP Chair Arrangement','PENDING','Front row',NULL,NULL,1,'2026-07-29 15:03:23.656','2026-07-29 15:04:00.602','2026-07-29 15:04:00.587'),('ce204740-c2de-40d6-914a-414f07557089','197543ad-2fb5-4fae-9d7e-91f0f8776d4e','Stage Frame','PENDING',NULL,NULL,NULL,0,'2026-07-29 15:18:24.861','2026-07-29 15:18:35.498','2026-07-29 15:18:35.496'),('d80202a8-13a0-4855-b2e2-7f0fbf7cb2de','197543ad-2fb5-4fae-9d7e-91f0f8776d4e','LED Installation','PENDING',NULL,NULL,NULL,2,'2026-07-29 15:18:24.861','2026-07-29 15:18:35.498','2026-07-29 15:18:35.496'),('df4833ed-33cf-42a7-810c-5c0161ee57dc','08e5bd93-c6fa-4013-935e-318bbb10b9dc','Verify task C','PENDING',NULL,NULL,NULL,0,'2026-07-30 15:32:14.312','2026-07-30 15:32:14.558','2026-07-30 15:32:14.556'),('e13f94d7-3bc1-4f20-b894-6ccdcde4f54d','06990651-b80b-4b3a-9cfb-03e83d8232fb','Stage decor','PENDING',NULL,NULL,NULL,0,'2026-07-30 15:11:16.338','2026-07-30 15:11:16.338',NULL),('e559fbe3-88e1-4e57-ab5d-6421dca58695','197543ad-2fb5-4fae-9d7e-91f0f8776d4e','Flower Decoration','PENDING',NULL,NULL,NULL,1,'2026-07-29 15:18:24.861','2026-07-29 15:18:35.498','2026-07-29 15:18:35.496'),('e6d42e37-9a70-426d-a9d1-72f1e3e55c64','fe6a8293-8f38-4c7b-914f-30b925811528','stage','PENDING',NULL,NULL,NULL,0,'2026-07-29 19:09:31.713','2026-07-29 19:10:14.222',NULL),('ee24c6d3-51df-4425-8e33-e55ca2bddd1d','fe6a8293-8f38-4c7b-914f-30b925811528','hall','PENDING',NULL,NULL,NULL,1,'2026-07-29 19:09:31.713','2026-07-31 19:49:34.305',NULL),('f372ed53-94a5-438e-93fd-c59f4f87789f','d1c1d7ba-a244-4c5b-a692-d469d74866d3','Verify task A','COMPLETED',NULL,NULL,'2026-07-30 15:32:14.501',0,'2026-07-30 15:32:14.274','2026-07-30 15:32:14.540','2026-07-30 15:32:14.537');
/*!40000 ALTER TABLE `task_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_templates`
--

DROP TABLE IF EXISTS `task_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_templates` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `task_name` varchar(191) NOT NULL,
  `task_category` enum('PLANNING','EXECUTION') NOT NULL DEFAULT 'EXECUTION',
  `display_order` int(11) NOT NULL DEFAULT 0,
  `is_default` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `task_templates_company_id_fkey` (`company_id`),
  CONSTRAINT `task_templates_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_templates`
--

LOCK TABLES `task_templates` WRITE;
/*!40000 ALTER TABLE `task_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_group_permissions`
--

DROP TABLE IF EXISTS `user_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_group_permissions` (
  `id` char(36) NOT NULL,
  `user_group_id` char(36) NOT NULL,
  `module` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_group_permissions_user_group_id_module_action_key` (`user_group_id`,`module`,`action`),
  CONSTRAINT `user_group_permissions_user_group_id_fkey` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_group_permissions`
--

LOCK TABLES `user_group_permissions` WRITE;
/*!40000 ALTER TABLE `user_group_permissions` DISABLE KEYS */;
INSERT INTO `user_group_permissions` VALUES ('0e15aa26-ed0e-4e8a-abd7-82a095d44d88','a8d1510a-0d15-432e-8e51-85f3e2c19843','PLANNING','canUpdateChecklist','2026-07-31 18:40:53.093'),('121ce6ea-a433-4fd0-b5a9-9f2b46164a50','a8d1510a-0d15-432e-8e51-85f3e2c19843','CALENDAR','canView','2026-07-31 18:40:53.093'),('6347fe62-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','DASHBOARD','canView','2026-07-31 01:31:01.103'),('6348056b-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','DASHBOARD','canView','2026-07-31 01:31:01.103'),('63480718-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','DASHBOARD','canView','2026-07-31 01:31:01.103'),('634807bf-8c51-11f1-a799-9cc7d31fd403','b126f132-8ff0-456d-8f4c-915532bbf79d','DASHBOARD','canView','2026-07-31 01:31:01.103'),('63480840-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','MASTERS','canView','2026-07-31 01:31:01.103'),('634808a1-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','MASTERS','canView','2026-07-31 01:31:01.103'),('63480911-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','MASTERS','canCreate','2026-07-31 01:31:01.103'),('63480986-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','MASTERS','canEdit','2026-07-31 01:31:01.103'),('634809f5-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','MASTERS','canDelete','2026-07-31 01:31:01.103'),('63482620-8c51-11f1-a799-9cc7d31fd403','b126f132-8ff0-456d-8f4c-915532bbf79d','MASTERS','canView','2026-07-31 01:31:01.103'),('63482949-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','MASTERS','canView','2026-07-31 01:31:01.103'),('634829b5-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','MASTERS','canCreate','2026-07-31 01:31:01.103'),('63482b41-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','MASTERS','canEdit','2026-07-31 01:31:01.103'),('63482e15-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','CUSTOMERS','canView','2026-07-31 01:31:01.103'),('63482e80-8c51-11f1-a799-9cc7d31fd403','b126f132-8ff0-456d-8f4c-915532bbf79d','CUSTOMERS','canView','2026-07-31 01:31:01.103'),('63482ee3-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','CUSTOMERS','canView','2026-07-31 01:31:01.103'),('63482f48-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','CUSTOMERS','canView','2026-07-31 01:31:01.103'),('63483018-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','CUSTOMERS','canExport','2026-07-31 01:31:01.103'),('63483083-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','CUSTOMERS','canExport','2026-07-31 01:31:01.103'),('634830fb-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','ENQUIRIES','canView','2026-07-31 01:31:01.103'),('6348315f-8c51-11f1-a799-9cc7d31fd403','b126f132-8ff0-456d-8f4c-915532bbf79d','ENQUIRIES','canView','2026-07-31 01:31:01.103'),('634831cd-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','ENQUIRIES','canView','2026-07-31 01:31:01.103'),('63483287-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','ENQUIRIES','canView','2026-07-31 01:31:01.103'),('634832f4-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','ENQUIRIES','canCreate','2026-07-31 01:31:01.103'),('63483358-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','ENQUIRIES','canCreate','2026-07-31 01:31:01.103'),('634833ba-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','ENQUIRIES','canCreate','2026-07-31 01:31:01.103'),('63483431-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','ENQUIRIES','canEdit','2026-07-31 01:31:01.103'),('63483496-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','ENQUIRIES','canEdit','2026-07-31 01:31:01.103'),('634834fd-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','ENQUIRIES','canEdit','2026-07-31 01:31:01.103'),('63483578-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','ENQUIRIES','canAssign','2026-07-31 01:31:01.103'),('634835d9-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','ENQUIRIES','canAssign','2026-07-31 01:31:01.103'),('6348363d-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','ENQUIRIES','canAssign','2026-07-31 01:31:01.103'),('634836a8-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','ENQUIRIES','canChangeStatus','2026-07-31 01:31:01.103'),('63483709-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','ENQUIRIES','canChangeStatus','2026-07-31 01:31:01.103'),('6348376e-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','ENQUIRIES','canChangeStatus','2026-07-31 01:31:01.103'),('634837db-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','ENQUIRIES','canExport','2026-07-31 01:31:01.103'),('63483844-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','ENQUIRIES','canExport','2026-07-31 01:31:01.103'),('634838ae-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','ENQUIRIES','canExport','2026-07-31 01:31:01.103'),('6348391e-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','QUOTATIONS','canView','2026-07-31 01:31:01.103'),('6348398e-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','QUOTATIONS','canView','2026-07-31 01:31:01.103'),('634839ec-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','QUOTATIONS','canView','2026-07-31 01:31:01.103'),('63483a63-8c51-11f1-a799-9cc7d31fd403','b126f132-8ff0-456d-8f4c-915532bbf79d','QUOTATIONS','canView','2026-07-31 01:31:01.103'),('63483b33-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','QUOTATIONS','canCreate','2026-07-31 01:31:01.103'),('63483ba9-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','QUOTATIONS','canCreate','2026-07-31 01:31:01.103'),('63483c0b-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','QUOTATIONS','canCreate','2026-07-31 01:31:01.103'),('63483c8b-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','QUOTATIONS','canEdit','2026-07-31 01:31:01.103'),('63483d06-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','QUOTATIONS','canEdit','2026-07-31 01:31:01.103'),('63483d72-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','QUOTATIONS','canEdit','2026-07-31 01:31:01.103'),('63483dfb-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','QUOTATIONS','canApprove','2026-07-31 01:31:01.103'),('63483e5d-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','QUOTATIONS','canApprove','2026-07-31 01:31:01.103'),('63483edd-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','QUOTATIONS','canPrint','2026-07-31 01:31:01.103'),('63483f64-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','QUOTATIONS','canExport','2026-07-31 01:31:01.103'),('63484128-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','ORDERS','canView','2026-07-31 01:31:01.103'),('63484201-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','ORDERS','canView','2026-07-31 01:31:01.103'),('634847b9-8c51-11f1-a799-9cc7d31fd403','b126f132-8ff0-456d-8f4c-915532bbf79d','ORDERS','canView','2026-07-31 01:31:01.103'),('63484968-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','ORDERS','canView','2026-07-31 01:31:01.103'),('63484a98-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','ORDERS','canCreate','2026-07-31 01:31:01.103'),('63484b66-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','ORDERS','canCreate','2026-07-31 01:31:01.103'),('63484c87-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','ENQUIRIES','canConvertToOrder','2026-07-31 01:31:01.103'),('63484d5e-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','ENQUIRIES','canConvertToOrder','2026-07-31 01:31:01.103'),('63484ef4-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','ORDERS','canEdit','2026-07-31 01:31:01.103'),('63484fc4-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','ORDERS','canEdit','2026-07-31 01:31:01.103'),('634851b5-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','ORDERS','canCancel','2026-07-31 01:31:01.103'),('63485264-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','ORDERS','canCancel','2026-07-31 01:31:01.103'),('634854c6-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','ORDERS','canCompleteEvent','2026-07-31 01:31:01.103'),('634855bc-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','ORDERS','canCompleteEvent','2026-07-31 01:31:01.103'),('63485696-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','ORDERS','canExport','2026-07-31 01:31:01.103'),('6348577f-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','ORDERS','canExport','2026-07-31 01:31:01.103'),('63485851-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','PLANNING','canView','2026-07-31 01:31:01.103'),('63485a8d-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','PLANNING','canView','2026-07-31 01:31:01.103'),('63485b46-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','PLANNING','canView','2026-07-31 01:31:01.103'),('63485c1a-8c51-11f1-a799-9cc7d31fd403','b126f132-8ff0-456d-8f4c-915532bbf79d','PLANNING','canView','2026-07-31 01:31:01.103'),('63485d12-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','PLANNING','canCreate','2026-07-31 01:31:01.103'),('63485ee5-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','PLANNING','canCreate','2026-07-31 01:31:01.103'),('6348603e-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','PLANNING','canEdit','2026-07-31 01:31:01.103'),('63486265-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','PLANNING','canEdit','2026-07-31 01:31:01.103'),('6348634d-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','PLANNING','canUpdateChecklist','2026-07-31 01:31:01.103'),('63486540-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','PLANNING','canUpdateChecklist','2026-07-31 01:31:01.103'),('6348661c-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','PLANNING','canDelete','2026-07-31 01:31:01.103'),('63486787-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','PLANNING','canDelete','2026-07-31 01:31:01.103'),('634867f3-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','PAYMENTS','canView','2026-07-31 01:31:01.103'),('6348685d-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','PAYMENTS','canView','2026-07-31 01:31:01.103'),('634868bc-8c51-11f1-a799-9cc7d31fd403','b126f132-8ff0-456d-8f4c-915532bbf79d','PAYMENTS','canView','2026-07-31 01:31:01.103'),('6348698c-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','PAYMENTS','canView','2026-07-31 01:31:01.103'),('634869fd-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','PAYMENTS','canPrint','2026-07-31 01:31:01.103'),('63486a64-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','PAYMENTS','canPrint','2026-07-31 01:31:01.103'),('63486ac1-8c51-11f1-a799-9cc7d31fd403','b126f132-8ff0-456d-8f4c-915532bbf79d','PAYMENTS','canPrint','2026-07-31 01:31:01.103'),('63486b83-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','PAYMENTS','canPrint','2026-07-31 01:31:01.103'),('63486bf2-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','PAYMENTS','canCreate','2026-07-31 01:31:01.103'),('63486c58-8c51-11f1-a799-9cc7d31fd403','b126f132-8ff0-456d-8f4c-915532bbf79d','PAYMENTS','canCreate','2026-07-31 01:31:01.103'),('63486cc4-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','PAYMENTS','canEdit','2026-07-31 01:31:01.103'),('63486d2b-8c51-11f1-a799-9cc7d31fd403','b126f132-8ff0-456d-8f4c-915532bbf79d','PAYMENTS','canEdit','2026-07-31 01:31:01.103'),('63486d94-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','PAYMENTS','canExport','2026-07-31 01:31:01.103'),('63486e03-8c51-11f1-a799-9cc7d31fd403','b126f132-8ff0-456d-8f4c-915532bbf79d','PAYMENTS','canExport','2026-07-31 01:31:01.103'),('63486e6e-8c51-11f1-a799-9cc7d31fd403','b126f132-8ff0-456d-8f4c-915532bbf79d','CALENDAR','canView','2026-07-31 01:31:01.103'),('63486ece-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','CALENDAR','canView','2026-07-31 01:31:01.103'),('63486f34-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','CALENDAR','canView','2026-07-31 01:31:01.103'),('63486fc6-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','CALENDAR','canView','2026-07-31 01:31:01.103'),('63487099-8c51-11f1-a799-9cc7d31fd403','b126f132-8ff0-456d-8f4c-915532bbf79d','REPORTS','canView','2026-07-31 01:31:01.103'),('63487110-8c51-11f1-a799-9cc7d31fd403','7d5b4851-b4eb-4b7a-86af-933c84a374e3','REPORTS','canView','2026-07-31 01:31:01.103'),('63487180-8c51-11f1-a799-9cc7d31fd403','4195008e-211e-4fad-9f4f-3174bb58183f','REPORTS','canView','2026-07-31 01:31:01.103'),('634871d7-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','REPORTS','canView','2026-07-31 01:31:01.103'),('634872c1-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','REPORTS','canExport','2026-07-31 01:31:01.103'),('63487353-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','SETTINGS','canView','2026-07-31 01:31:01.103'),('634873e3-8c51-11f1-a799-9cc7d31fd403','c595b9e1-656e-4294-be2f-465d7cbdeb4a','SETTINGS','canEdit','2026-07-31 01:31:01.103'),('7b52bfda-aad7-42b9-b251-178c0cdbed62','a8d1510a-0d15-432e-8e51-85f3e2c19843','PLANNING','canCreate','2026-07-31 18:40:53.093'),('cc54cb47-d8bc-47b7-b7a9-2035cc82839d','a8d1510a-0d15-432e-8e51-85f3e2c19843','PLANNING','canEdit','2026-07-31 18:40:53.093'),('ff5bfca9-330c-415a-8192-c6ec91f8789b','a8d1510a-0d15-432e-8e51-85f3e2c19843','PLANNING','canView','2026-07-31 18:40:53.093');
/*!40000 ALTER TABLE `user_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_groups`
--

DROP TABLE IF EXISTS `user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_groups` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `group_name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_groups_company_id_group_name_key` (`company_id`,`group_name`),
  CONSTRAINT `user_groups_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_groups`
--

LOCK TABLES `user_groups` WRITE;
/*!40000 ALTER TABLE `user_groups` DISABLE KEYS */;
INSERT INTO `user_groups` VALUES ('4195008e-211e-4fad-9f4f-3174bb58183f','65954d03-7a19-44ad-8f9a-2e31bb53abb5','Manager',NULL,'ACTIVE','2026-07-21 14:54:44.462','2026-07-21 14:54:44.462',NULL),('7d5b4851-b4eb-4b7a-86af-933c84a374e3','65954d03-7a19-44ad-8f9a-2e31bb53abb5','Sales Executive',NULL,'ACTIVE','2026-07-21 14:54:44.510','2026-07-21 14:54:44.510',NULL),('a8d1510a-0d15-432e-8e51-85f3e2c19843','65954d03-7a19-44ad-8f9a-2e31bb53abb5','Event Coordinator',NULL,'ACTIVE','2026-07-21 14:54:44.560','2026-07-31 18:40:53.112',NULL),('b126f132-8ff0-456d-8f4c-915532bbf79d','65954d03-7a19-44ad-8f9a-2e31bb53abb5','Accountant',NULL,'ACTIVE','2026-07-21 14:54:44.610','2026-07-21 14:54:44.610',NULL),('c595b9e1-656e-4294-be2f-465d7cbdeb4a','65954d03-7a19-44ad-8f9a-2e31bb53abb5','Super Admin',NULL,'ACTIVE','2026-07-21 14:54:44.400','2026-07-21 14:54:44.400',NULL);
/*!40000 ALTER TABLE `user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permission_overrides`
--

DROP TABLE IF EXISTS `user_permission_overrides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_permission_overrides` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `module` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_permission_overrides_user_id_module_action_key` (`user_id`,`module`,`action`),
  CONSTRAINT `user_permission_overrides_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permission_overrides`
--

LOCK TABLES `user_permission_overrides` WRITE;
/*!40000 ALTER TABLE `user_permission_overrides` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_permission_overrides` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `full_name` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `mobile` varchar(191) NOT NULL,
  `password_hash` varchar(191) NOT NULL,
  `profile_photo` varchar(191) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `employee_code` varchar(191) DEFAULT NULL,
  `username` varchar(191) NOT NULL,
  `city` varchar(191) DEFAULT NULL,
  `user_group_id` char(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_key` (`username`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_mobile_idx` (`mobile`),
  KEY `users_company_id_fkey` (`company_id`),
  KEY `users_user_group_id_fkey` (`user_group_id`),
  CONSTRAINT `users_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `users_user_group_id_fkey` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('516ad262-38be-4fc6-be4a-a2853132d1bd','65954d03-7a19-44ad-8f9a-2e31bb53abb5','Super Admin','admin@sanju.local','','$2b$10$p9YAgZ1/jOG0p1xcC3Pq3ea6H4IrE9WiU7edmNKQ5mnao8gJqKCmW',NULL,1,'2026-07-21 14:54:44.752','2026-07-31 18:17:18.576',NULL,NULL,'admin',NULL,'c595b9e1-656e-4294-be2f-465d7cbdeb4a'),('d4028a53-fd73-485a-bee8-d56514f11b12','65954d03-7a19-44ad-8f9a-2e31bb53abb5','Sanju','sanju@gmail.com','','$2b$10$g4hkZjl9ZyZ4IKKVYuIC3O6nT/m34ol2f3wsalfIfATCvkuKzNCS2',NULL,1,'2026-07-21 14:55:01.335','2026-07-31 18:11:55.781',NULL,NULL,'sanju',NULL,'c595b9e1-656e-4294-be2f-465d7cbdeb4a');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'sanju'
--

--
-- Dumping routines for database 'sanju'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-04 20:18:15
