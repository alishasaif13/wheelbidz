-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: copart
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tbl_about`
--

DROP TABLE IF EXISTS `tbl_about`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_about` (
  `id` int NOT NULL AUTO_INCREMENT,
  `heading1` varchar(255) DEFAULT NULL,
  `subheading1` text,
  `image1` varchar(255) DEFAULT NULL,
  `heading2` varchar(255) DEFAULT NULL,
  `subheading2` text,
  `image2` varchar(255) DEFAULT NULL,
  `heading3` varchar(255) DEFAULT NULL,
  `subheading3` text,
  `image3` varchar(255) DEFAULT NULL,
  `heading4` varchar(255) DEFAULT NULL,
  `subheading4` text,
  `image4` varchar(255) DEFAULT NULL,
  `heading5` varchar(255) DEFAULT NULL,
  `subheading5` text,
  `image5` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_about`
--

LOCK TABLES `tbl_about` WRITE;
/*!40000 ALTER TABLE `tbl_about` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_about` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_bid`
--

DROP TABLE IF EXISTS `tbl_bid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_bid` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `vehicleId` int NOT NULL,
  `estRetailValue` int DEFAULT NULL,
  `yourOffer` int DEFAULT NULL,
  `sellerOffer` int DEFAULT NULL,
  `bidStatus` enum('Yes','No') NOT NULL DEFAULT 'No',
  `eligibilityStatus` enum('Yes','No') NOT NULL DEFAULT 'Yes',
  `saleStatus` varchar(100) NOT NULL,
  `maxBid` int DEFAULT NULL,
  `MonsterBid` int DEFAULT NULL,
  `bidApprStatus` enum('initialized','ongoing','completed') DEFAULT NULL,
  `status` enum('Y','N') NOT NULL DEFAULT 'Y',
  `winStatus` enum('Won','Lost') DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `startTime` datetime DEFAULT NULL,
  `endTime` datetime DEFAULT NULL,
  `auctionStatus` enum('upcoming','live','end') DEFAULT 'upcoming',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `vehicleId` (`vehicleId`),
  CONSTRAINT `tbl_bid_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `tbl_users` (`id`),
  CONSTRAINT `tbl_bid_ibfk_2` FOREIGN KEY (`vehicleId`) REFERENCES `tbl_vehicles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_bid`
--

LOCK TABLES `tbl_bid` WRITE;
/*!40000 ALTER TABLE `tbl_bid` DISABLE KEYS */;
INSERT INTO `tbl_bid` VALUES (24,8,12,NULL,9000000,120000,'No','Yes','sold',NULL,90000000,'completed','Y','Won','2025-07-04 11:52:42','2025-07-25 11:30:41','2025-08-05 05:53:00','2025-08-05 15:53:00','live'),(25,6,12,NULL,NULL,800000000,'No','Yes','sold',NULL,78000000,'completed','Y','Won','2025-07-07 07:27:54','2025-07-26 06:27:23','2025-07-07 11:00:00','2025-07-09 14:00:00','upcoming'),(26,1,19,NULL,NULL,1121212,'No','Yes','pending',NULL,NULL,NULL,'Y',NULL,'2025-07-28 12:59:17','2025-07-28 12:59:44','2025-07-28 05:59:00','2025-07-29 05:59:00','live');
/*!40000 ALTER TABLE `tbl_bid` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_brands`
--

DROP TABLE IF EXISTS `tbl_brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_brands` (
  `id` int NOT NULL AUTO_INCREMENT,
  `brandName` varchar(255) NOT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `status` enum('Y','N') DEFAULT 'Y',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_brands`
--

LOCK TABLES `tbl_brands` WRITE;
/*!40000 ALTER TABLE `tbl_brands` DISABLE KEYS */;
INSERT INTO `tbl_brands` VALUES (12,'Audi',NULL,'Y'),(13,'Suzuki','uploads/1753527227234-3333.jpg','Y'),(14,'BMW','uploads/1753423037463-WhatsApp Image 2025-04-21 at 10.07.05_47ee8a42.jpg','Y'),(15,'BMW','uploads/1753423078736-WhatsApp Image 2025-04-21 at 10.07.05_47ee8a42.jpg','Y'),(16,'HONDA','uploads/1753435469992-vehicle_auction_erd.png','Y'),(17,'Rose Roice','uploads/1753436351105-vehicle_auction_erd.png','Y');
/*!40000 ALTER TABLE `tbl_brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_calender`
--

DROP TABLE IF EXISTS `tbl_calender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_calender` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `day` varchar(255) DEFAULT NULL,
  `location` varchar(255) NOT NULL,
  `status` enum('Y','N') NOT NULL DEFAULT 'Y',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_calender`
--

LOCK TABLES `tbl_calender` WRITE;
/*!40000 ALTER TABLE `tbl_calender` DISABLE KEYS */;
INSERT INTO `tbl_calender` VALUES (8,'2025-07-16','monday','[\"Gujranwala\",\"Hafizabad\"]','Y','2025-07-16 06:22:40','2025-07-16 06:22:40'),(9,'2025-07-25','Friday','[\"Islamabad\",\"Karachi\",\"Gujranwala\",\"jehlum\"]','Y','2025-07-16 06:53:50','2025-07-16 06:53:50');
/*!40000 ALTER TABLE `tbl_calender` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_contact_form`
--

DROP TABLE IF EXISTS `tbl_contact_form`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_contact_form` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject` varchar(255) NOT NULL,
  `email` varchar(150) NOT NULL,
  `contactNumber` varchar(50) DEFAULT NULL,
  `description` text NOT NULL,
  `date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Y','N') DEFAULT 'Y',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_contact_form`
--

LOCK TABLES `tbl_contact_form` WRITE;
/*!40000 ALTER TABLE `tbl_contact_form` DISABLE KEYS */;
INSERT INTO `tbl_contact_form` VALUES (1,'asa','hamzaamin104@gmail.com','11111111111','d','2025-07-08 12:41:15','Y'),(2,'asa','hamzaamin104@gmail.com','11111111111','d','2025-07-08 12:42:51','Y'),(3,'asa','hamzaamin104@gmail.com','11111111111','d','2025-07-08 12:44:15','Y'),(4,'hamza ','harib@gmail.com','9898989898','dhjsdjsadjs','2025-07-08 12:44:57','Y'),(5,'hamza amin','hamza11@gmail.com','878788372','hamzazma jbd','2025-07-08 12:47:42','Y'),(6,'hamza','hamzaamin104@gmail.com','89898989899898989898989989','i need civic','2025-07-11 09:31:47','Y');
/*!40000 ALTER TABLE `tbl_contact_form` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_fund_deposit`
--

DROP TABLE IF EXISTS `tbl_fund_deposit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_fund_deposit` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `paymentMethod` varchar(50) DEFAULT NULL,
  `referenceNo` varchar(100) DEFAULT NULL,
  `date` datetime DEFAULT CURRENT_TIMESTAMP,
  `invoiceNo` varchar(100) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `tbl_fund_deposit_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `tbl_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_fund_deposit`
--

LOCK TABLES `tbl_fund_deposit` WRITE;
/*!40000 ALTER TABLE `tbl_fund_deposit` DISABLE KEYS */;
INSERT INTO `tbl_fund_deposit` VALUES (6,1,199.00,'Approved','Credit Card','REF123456','2025-04-28 11:39:34','FUN-1',NULL),(9,8,11000.00,'Pending','Bank Transfer','REF123456','2025-04-29 10:59:49','FUN-13','Deposit for January earnings');
/*!40000 ALTER TABLE `tbl_fund_deposit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_fund_withdraw`
--

DROP TABLE IF EXISTS `tbl_fund_withdraw`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_fund_withdraw` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paymentMethod` varchar(100) NOT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `description` text,
  `invoiceNo` varchar(100) DEFAULT NULL,
  `date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `tbl_fund_withdraw_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `tbl_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_fund_withdraw`
--

LOCK TABLES `tbl_fund_withdraw` WRITE;
/*!40000 ALTER TABLE `tbl_fund_withdraw` DISABLE KEYS */;
INSERT INTO `tbl_fund_withdraw` VALUES (1,1,450.00,'','Approved','Deposit for monthly savings','WITH-1','2025-04-28 12:38:48'),(23,8,2000.00,'Bank Transfer','Pending','Withdraw of January earnings','WITH-11','2025-04-29 11:02:08'),(24,8,2000.00,'Bank Transfer','Pending','Withdraw of January earnings','WITH-12','2025-04-29 11:03:50'),(25,8,2000.00,'Bank Transfer','Pending','Withdraw of January earnings','WITH-13','2025-04-29 11:04:36'),(26,8,2000.00,'Bank Transfer','Pending','Withdraw of January earnings','WITH-14','2025-04-29 11:07:33'),(27,8,2000.00,'Bank Transfer','Pending','Withdraw of January earnings','WITH-15','2025-04-29 11:07:42');
/*!40000 ALTER TABLE `tbl_fund_withdraw` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_funds_transaction`
--

DROP TABLE IF EXISTS `tbl_funds_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_funds_transaction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `fundId` int NOT NULL,
  `paymentMethod` varchar(100) NOT NULL,
  `amount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `description` text,
  `transactionDate` datetime NOT NULL,
  `referenceNo` varchar(255) DEFAULT NULL,
  `invoiceNo` varchar(255) DEFAULT NULL,
  `status` enum('Y','N') DEFAULT 'Y',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `fundId` (`fundId`),
  CONSTRAINT `tbl_funds_transaction_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `tbl_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tbl_funds_transaction_ibfk_2` FOREIGN KEY (`fundId`) REFERENCES `tbl_tracking_funds` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_funds_transaction`
--

LOCK TABLES `tbl_funds_transaction` WRITE;
/*!40000 ALTER TABLE `tbl_funds_transaction` DISABLE KEYS */;
INSERT INTO `tbl_funds_transaction` VALUES (1,8,1,'card',7000.00,'Vehicle purchase','2025-04-26 00:00:00','TEST-001','PAY-1','Y','2025-04-26 16:06:38','2025-04-26 16:06:38'),(2,6,1,'card',65000.00,'Vehicle purchase','2025-04-26 00:00:00','TEST-001','PAY-11','Y','2025-04-26 16:09:14','2025-04-26 16:09:14'),(11,8,1,'card',7000.00,'Vehicle purchase','2025-04-28 00:00:00','TEST-001','PAY-7','Y','2025-04-28 10:26:42','2025-04-28 10:26:42');
/*!40000 ALTER TABLE `tbl_funds_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_home`
--

DROP TABLE IF EXISTS `tbl_home`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_home` (
  `id` int NOT NULL AUTO_INCREMENT,
  `heroTitle` varchar(255) DEFAULT NULL,
  `heroSubTitle` varchar(255) DEFAULT NULL,
  `heroBgImage` varchar(255) DEFAULT NULL,
  `afterHeroDesc` text,
  `makingImage` varchar(255) DEFAULT NULL,
  `makingTitle` varchar(255) DEFAULT NULL,
  `makingDesc` text,
  `promiseImage` varchar(255) DEFAULT NULL,
  `promiseDesc` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Y','N') DEFAULT 'Y',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_home`
--

LOCK TABLES `tbl_home` WRITE;
/*!40000 ALTER TABLE `tbl_home` DISABLE KEYS */;
INSERT INTO `tbl_home` VALUES (1,'Welcome to HealthSecond','Your Journey to Wellness Begins Here',NULL,'At HealthFirst, we combine technology and care to deliver the best in healthcare services. Trust us to walk with you every step of the',NULL,'How We Make It Work','From personalized consultations to timely follow-ups, our process is designed around you. Experience a seamless  digital convenience.',NULL,'We promise transparency, commitment, and exceptional care. Every decision we make is centered around your well-being.','2025-05-06 10:59:16','Y'),(2,'Welcome to HealthFirst','Your Journey to Wellness Begins Here',NULL,'At HealthFirst, we combine technology and care to deliver the best in healthcare services. Trust us to walk with you every step of the',NULL,'How We Make It Work','From personalized consultations to timely follow-ups, our process is designed around you. Experience a seamless  digital convenience.',NULL,'We promise transparency, commitment, and exceptional care. Every decision we make is centered around your well-being.','2025-05-06 11:13:42','N');
/*!40000 ALTER TABLE `tbl_home` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_imported_cars`
--

DROP TABLE IF EXISTS `tbl_imported_cars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_imported_cars` (
  `id` int NOT NULL AUTO_INCREMENT,
  `make` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  `year` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `city` varchar(100) NOT NULL,
  `mobileNumber` varchar(20) NOT NULL,
  `status` enum('Y','N') DEFAULT 'Y',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_imported_cars`
--

LOCK TABLES `tbl_imported_cars` WRITE;
/*!40000 ALTER TABLE `tbl_imported_cars` DISABLE KEYS */;
INSERT INTO `tbl_imported_cars` VALUES (1,'Austin','A4',2001,'aabc','sdas','23232','Y'),(2,'Austin','A4',2001,'aabc','sdas','23232','N'),(3,'Austin','A4',2001,'aabc','sdas','23232','N'),(4,'Austin','A5',2001,'sd','dsads','23213213','N'),(5,'Austin','A5',2001,'sd','dsads','23213213','N'),(6,'Austin','A5',2001,'sd','dsads','23213213','Y'),(7,'BAIC','A5',2003,'jd','hh','12','Y'),(8,'Honda','Sorento',2023,'hamza','hfzbd','12344','Y'),(9,'Honda','Sorento',2023,'sdsdsd','ddssd','232323','Y'),(10,'Honda','Civic',2020,'Ali Khan','Lahore','+923001234567','Y');
/*!40000 ALTER TABLE `tbl_imported_cars` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_invoice`
--

DROP TABLE IF EXISTS `tbl_invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_invoice` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoiceNo` varchar(20) NOT NULL,
  `invoiceNo2` varchar(45) NOT NULL,
  `withdrawInvoice` varchar(255) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoiceNo` (`invoiceNo`),
  UNIQUE KEY `invoiceNo2_UNIQUE` (`invoiceNo2`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_invoice`
--

LOCK TABLES `tbl_invoice` WRITE;
/*!40000 ALTER TABLE `tbl_invoice` DISABLE KEYS */;
INSERT INTO `tbl_invoice` VALUES (1,'8','14','16','2025-04-26 11:06:37');
/*!40000 ALTER TABLE `tbl_invoice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_physical_bidding_locations`
--

DROP TABLE IF EXISTS `tbl_physical_bidding_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_physical_bidding_locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicleId` int NOT NULL,
  `address` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `postalCode` varchar(20) NOT NULL,
  `contactPersonName` varchar(150) NOT NULL,
  `contactNo` varchar(20) NOT NULL,
  `status` enum('Y','N') DEFAULT 'Y',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_vehicle` (`vehicleId`),
  CONSTRAINT `fk_vehicle` FOREIGN KEY (`vehicleId`) REFERENCES `tbl_vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_physical_bidding_locations`
--

LOCK TABLES `tbl_physical_bidding_locations` WRITE;
/*!40000 ALTER TABLE `tbl_physical_bidding_locations` DISABLE KEYS */;
INSERT INTO `tbl_physical_bidding_locations` VALUES (2,4,'123 Queen Street','New York','10001','John Doe','1234567890','N','2025-04-29 06:41:17','2025-04-29 07:01:09');
/*!40000 ALTER TABLE `tbl_physical_bidding_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_sales`
--

DROP TABLE IF EXISTS `tbl_sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_sales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `vehicleId` int NOT NULL,
  `saleTime` time DEFAULT NULL,
  `saleName` varchar(255) NOT NULL,
  `region` varchar(100) DEFAULT NULL,
  `saleType` varchar(50) DEFAULT NULL,
  `saleHilight` text,
  `currentSale` tinyint(1) DEFAULT '0',
  `date` date NOT NULL,
  `saleStatus` enum('Y','N') DEFAULT 'Y',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `vehicleId` (`vehicleId`),
  CONSTRAINT `tbl_sales_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `tbl_users` (`id`),
  CONSTRAINT `tbl_sales_ibfk_2` FOREIGN KEY (`vehicleId`) REFERENCES `tbl_vehicles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_sales`
--

LOCK TABLES `tbl_sales` WRITE;
/*!40000 ALTER TABLE `tbl_sales` DISABLE KEYS */;
INSERT INTO `tbl_sales` VALUES (1,1,2,'02:00:00','Spring Vehicle Auction','Texas South','Online','Featured Listing - Low Mileage',1,'2025-04-25','Y','2025-04-23 10:37:56','2025-04-23 10:37:56'),(2,1,2,'02:00:00','Spring Vehicle Auction','Texas South','Online','Featured Listing - Low Mileage',1,'2025-04-25','N','2025-04-23 10:41:44','2025-04-23 12:06:54'),(4,1,2,'02:00:00','Spring Vehicle Auction','Texas North','Online','Featured Listing - Low Mileage',1,'2025-04-24','Y','2025-04-23 10:57:25','2025-04-23 12:01:55'),(5,1,3,'16:45:00','Luxury Cars Exclusive','Florida East','Online','Luxury & Sport Featured Lineup',1,'2025-04-27','Y','2025-04-23 11:03:30','2025-04-23 11:03:30');
/*!40000 ALTER TABLE `tbl_sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_seller_account`
--

DROP TABLE IF EXISTS `tbl_seller_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_seller_account` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `invoiceNo` varchar(255) DEFAULT NULL,
  `date` datetime DEFAULT CURRENT_TIMESTAMP,
  `paymentMethod` varchar(100) DEFAULT NULL,
  `description` text,
  `debit` decimal(10,2) DEFAULT '0.00',
  `credit` decimal(10,2) DEFAULT '0.00',
  `balance` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `tbl_seller_account_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `tbl_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_seller_account`
--

LOCK TABLES `tbl_seller_account` WRITE;
/*!40000 ALTER TABLE `tbl_seller_account` DISABLE KEYS */;
INSERT INTO `tbl_seller_account` VALUES (1,8,'SEL-13','2025-04-29 10:59:49','Bank Transfer','Deposit for January earnings',15000.00,0.00,15000.00),(5,8,'WITH-14','2025-04-29 11:07:33','Bank Transfer','Withdraw of January earnings',15000.00,2000.00,13000.00),(6,8,'WITH-15','2025-04-29 11:07:42','Bank Transfer','Withdraw of January earnings',13000.00,2000.00,11000.00);
/*!40000 ALTER TABLE `tbl_seller_account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_selling`
--

DROP TABLE IF EXISTS `tbl_selling`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_selling` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `year` year NOT NULL,
  `make` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  `bussinessName` varchar(150) DEFAULT NULL,
  `noOfCars` int DEFAULT '1',
  `sellerType` enum('Member','BusinessMember','Dealer') NOT NULL,
  `status` enum('Y','N') DEFAULT 'Y',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `tbl_selling_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `tbl_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_selling`
--

LOCK TABLES `tbl_selling` WRITE;
/*!40000 ALTER TABLE `tbl_selling` DISABLE KEYS */;
INSERT INTO `tbl_selling` VALUES (1,8,2022,'Toyota','Corolla','City Auto Traders',5,'Dealer','Y');
/*!40000 ALTER TABLE `tbl_selling` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_tracking_funds`
--

DROP TABLE IF EXISTS `tbl_tracking_funds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_tracking_funds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `totalBalance` decimal(18,2) NOT NULL DEFAULT '0.00',
  `lockedBalance` decimal(18,2) NOT NULL DEFAULT '0.00',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('Y','N') DEFAULT 'Y',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `tbl_tracking_funds_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `tbl_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_tracking_funds`
--

LOCK TABLES `tbl_tracking_funds` WRITE;
/*!40000 ALTER TABLE `tbl_tracking_funds` DISABLE KEYS */;
INSERT INTO `tbl_tracking_funds` VALUES (1,8,700000.00,700000.00,'2025-04-26 15:40:31','2025-04-26 15:50:45','Y'),(2,1,60000.00,60000.00,'2025-04-26 16:24:44','2025-04-26 16:24:44','Y');
/*!40000 ALTER TABLE `tbl_tracking_funds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_users`
--

DROP TABLE IF EXISTS `tbl_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `contact` varchar(20) NOT NULL,
  `cnic` varchar(15) NOT NULL,
  `address` text NOT NULL,
  `postcode` varchar(10) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `role` enum('customer','seller','admin') NOT NULL DEFAULT 'customer',
  `status` enum('N','Y') NOT NULL DEFAULT 'Y',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`),
  UNIQUE KEY `cnic_unique` (`cnic`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_users`
--

LOCK TABLES `tbl_users` WRITE;
/*!40000 ALTER TABLE `tbl_users` DISABLE KEYS */;
INSERT INTO `tbl_users` VALUES (1,'owais','0330303300','341011231231','grw','50250','owais@gmail.com','$2b$10$SIDTKxWv6Rk50BJtNizWN.eZTeUeGdD/aYzHndHmpDMt9sdeh2fby',NULL,'2025-12-11 19:00:00','admin','Y'),(6,'Sara Khan','03111234567','35201-9876543-1','456 Liberty Market, Lahore','54000','sara.khan@example.com','$2b$10$c7HxxGjngZBwZZq8K9o6lOjZkACm5M7LxzjAGaB61eLIk7STbVIXW',NULL,'2025-04-21 19:00:00','customer','Y'),(8,'Danish Mirza','03123456789','35202-9876543-1','House #15, Block C, Bahria Town','75300','dmughal908@gmail.com','$2b$10$LwzyNwrT..ciy5jRdR4KPuAmVSZjFkX4HnSabqpsh/ryRvYmAyQx6',NULL,'2025-04-24 19:00:00','seller','Y'),(10,'Salaman Khan','03111234567','35201-9876543-5','456 Liberty Market, Lahore','54000','khan@example.com','$2b$10$WOw1/IaXkNIIJ/fIjSkJCuFxv0pw.Q.3sEVYwqMDW5V62GvsZdG7S',NULL,'2025-05-26 19:00:00','seller','N'),(12,'Ahmed Raza','+92 300 1234567','35202-1234567-1','House #24, Street 10, G-11/3, Islamabad','44000','ahmed.raza@example.com','$2b$10$YXJ4sTKyyS5nrs8XFqadPuhp/U/lDLWNFH42sap0uVUICKz7VyN16',NULL,'2025-06-26 19:00:00','customer','Y');
/*!40000 ALTER TABLE `tbl_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_vehicle_comfort_features`
--

DROP TABLE IF EXISTS `tbl_vehicle_comfort_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_vehicle_comfort_features` (
  `id` int NOT NULL AUTO_INCREMENT,
  `comfAirConditioner` tinyint(1) DEFAULT NULL,
  `comfClimateControl` tinyint(1) DEFAULT NULL,
  `comfAirPurifier` tinyint(1) DEFAULT NULL,
  `comfRearAC` tinyint(1) DEFAULT NULL,
  `comfThirdRowAC` tinyint(1) DEFAULT NULL,
  `comfHeater` tinyint(1) DEFAULT NULL,
  `comfHeatedSeats` tinyint(1) DEFAULT NULL,
  `comfDefogger` tinyint(1) DEFAULT NULL,
  `comfCoolBox` tinyint(1) DEFAULT NULL,
  `comfNavigation` tinyint(1) DEFAULT NULL,
  `comfOptNavigation` tinyint(1) DEFAULT NULL,
  `comfFrontCamera` tinyint(1) DEFAULT NULL,
  `comfPowerSteering` tinyint(1) DEFAULT NULL,
  `comfCamera360` tinyint(1) DEFAULT NULL,
  `comfFrontSensors` tinyint(1) DEFAULT NULL,
  `comfAutoDimMirror` tinyint(1) DEFAULT NULL,
  `comfRearCentralControl` tinyint(1) DEFAULT NULL,
  `comfRearFoldingSeat` tinyint(1) DEFAULT NULL,
  `comfRearHeadrest` tinyint(1) DEFAULT NULL,
  `comfRearWiper` tinyint(1) DEFAULT NULL,
  `comfSeatMaterial` tinyint(1) DEFAULT NULL,
  `comfDriverElecAdjust` tinyint(1) DEFAULT NULL,
  `comfDriverLumbar` tinyint(1) DEFAULT NULL,
  `comfDriverMemory` tinyint(1) DEFAULT NULL,
  `comfPassengerElecAdjust` tinyint(1) DEFAULT NULL,
  `comfSteeringAdjust` tinyint(1) DEFAULT NULL,
  `comfSteeringSwitches` tinyint(1) DEFAULT NULL,
  `comfHeadlightReminder` tinyint(1) DEFAULT NULL,
  `comfAutoHeadlamps` tinyint(1) DEFAULT NULL,
  `comfRainWipers` tinyint(1) DEFAULT NULL,
  `comfHud` tinyint(1) DEFAULT NULL,
  `comfCruiseControl` tinyint(1) DEFAULT NULL,
  `comfDriveModes` tinyint(1) DEFAULT NULL,
  `comfPaddleShifter` tinyint(1) DEFAULT NULL,
  `comfKeyType` tinyint(1) DEFAULT NULL,
  `comfPushStart` tinyint(1) DEFAULT NULL,
  `comfRemoteStart` tinyint(1) DEFAULT NULL,
  `comfCentralLock` tinyint(1) DEFAULT NULL,
  `comfPowerDoorLocks` tinyint(1) DEFAULT NULL,
  `comfRearCamera` tinyint(1) DEFAULT NULL,
  `comfPowerWindows` tinyint(1) DEFAULT NULL,
  `comfPowerMirrors` tinyint(1) DEFAULT NULL,
  `comfMirrorsAutoFold` tinyint(1) DEFAULT NULL,
  `comfPowerBoot` tinyint(1) DEFAULT NULL,
  `comfCupHolders` tinyint(1) DEFAULT NULL,
  `comfArmRest` tinyint(1) DEFAULT NULL,
  `comfHandbrake` tinyint(1) DEFAULT NULL,
  `comfBrakeHold` tinyint(1) DEFAULT NULL,
  `comfAutoPark` tinyint(1) DEFAULT NULL,
  `comfIntLighting` tinyint(1) DEFAULT NULL,
  `comfGloveLamp` tinyint(1) DEFAULT NULL,
  `comfCargoLamp` tinyint(1) DEFAULT NULL,
  `comfFrontOutlet` tinyint(1) DEFAULT NULL,
  `comfRearOutlet` tinyint(1) DEFAULT NULL,
  `comfTpms` tinyint(1) DEFAULT NULL,
  `comfWirelessCharger` tinyint(1) DEFAULT NULL,
  `comfBossSeatSwitch` tinyint(1) DEFAULT NULL,
  `status` enum('Y','N') DEFAULT 'Y',
  `vehicleId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_tbl_vehicle_comfort_features` (`vehicleId`),
  CONSTRAINT `fk_tbl_vehicle_comfort_features` FOREIGN KEY (`vehicleId`) REFERENCES `tbl_vehicles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_vehicle_comfort_features`
--

LOCK TABLES `tbl_vehicle_comfort_features` WRITE;
/*!40000 ALTER TABLE `tbl_vehicle_comfort_features` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_vehicle_comfort_features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_vehicle_exterior_features`
--

DROP TABLE IF EXISTS `tbl_vehicle_exterior_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_vehicle_exterior_features` (
  `id` int NOT NULL AUTO_INCREMENT,
  `extBrakeAssist` tinyint(1) DEFAULT NULL,
  `extAdjHeadlights` tinyint(1) DEFAULT NULL,
  `extColoredDoorHandles` tinyint(1) DEFAULT NULL,
  `extRearSpoiler` tinyint(1) DEFAULT NULL,
  `extSideMirrorsInd` tinyint(1) DEFAULT NULL,
  `extSunRoof` tinyint(1) DEFAULT NULL,
  `extMoonRoof` tinyint(1) DEFAULT NULL,
  `extFogLights` tinyint(1) DEFAULT NULL,
  `extDrl` tinyint(1) DEFAULT NULL,
  `extRoofRails` tinyint(1) DEFAULT NULL,
  `extSideSteps` tinyint(1) DEFAULT NULL,
  `extDualExhaust` tinyint(1) DEFAULT NULL,
  `status` enum('Y','N') DEFAULT 'Y',
  `vehicleId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_tbl_vehicle_exterior_features` (`vehicleId`),
  CONSTRAINT `fk_tbl_vehicle_exterior_features` FOREIGN KEY (`vehicleId`) REFERENCES `tbl_vehicles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_vehicle_exterior_features`
--

LOCK TABLES `tbl_vehicle_exterior_features` WRITE;
/*!40000 ALTER TABLE `tbl_vehicle_exterior_features` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_vehicle_exterior_features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_vehicle_features`
--

DROP TABLE IF EXISTS `tbl_vehicle_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_vehicle_features` (
  `id` int NOT NULL AUTO_INCREMENT,
  `safetyFeaturesId` int NOT NULL,
  `exteriorFeaturesId` int NOT NULL,
  `instrumentationFeaturesId` int NOT NULL,
  `infotainmentFeaturesId` int NOT NULL,
  `comfortFeaturesId` int NOT NULL,
  `status` enum('Y','N') DEFAULT 'Y',
  `vehicleId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `safetyFeaturesId` (`safetyFeaturesId`),
  KEY `exteriorFeaturesId` (`exteriorFeaturesId`),
  KEY `instrumentationFeaturesId` (`instrumentationFeaturesId`),
  KEY `infotainmentFeaturesId` (`infotainmentFeaturesId`),
  KEY `comfortFeaturesId` (`comfortFeaturesId`),
  KEY `tbl_vehicles_idx` (`vehicleId`),
  CONSTRAINT `tbl_vehicle_features_ibfk_1` FOREIGN KEY (`safetyFeaturesId`) REFERENCES `tbl_vehicle_safety_features` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_vehicle_features_ibfk_2` FOREIGN KEY (`exteriorFeaturesId`) REFERENCES `tbl_vehicle_exterior_features` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_vehicle_features_ibfk_3` FOREIGN KEY (`instrumentationFeaturesId`) REFERENCES `tbl_vehicle_instrumentation_features` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_vehicle_features_ibfk_4` FOREIGN KEY (`infotainmentFeaturesId`) REFERENCES `tbl_vehicle_infotainment_features` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_vehicle_features_ibfk_5` FOREIGN KEY (`comfortFeaturesId`) REFERENCES `tbl_vehicle_comfort_features` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_vehicles` FOREIGN KEY (`vehicleId`) REFERENCES `tbl_vehicles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_vehicle_features`
--

LOCK TABLES `tbl_vehicle_features` WRITE;
/*!40000 ALTER TABLE `tbl_vehicle_features` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_vehicle_features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_vehicle_infotainment_features`
--

DROP TABLE IF EXISTS `tbl_vehicle_infotainment_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_vehicle_infotainment_features` (
  `id` int NOT NULL AUTO_INCREMENT,
  `infoCdPlayer` tinyint(1) DEFAULT NULL,
  `infoDvdPlayer` tinyint(1) DEFAULT NULL,
  `infoSpeakers` tinyint(1) DEFAULT NULL,
  `infoUsbAux` tinyint(1) DEFAULT NULL,
  `infoFrontSpeakers` tinyint(1) DEFAULT NULL,
  `infoBluetooth` tinyint(1) DEFAULT NULL,
  `infoRearSpeakers` tinyint(1) DEFAULT NULL,
  `infoDisplay` tinyint(1) DEFAULT NULL,
  `infoRearSeatEntertainment` tinyint(1) DEFAULT NULL,
  `infoVoiceControl` tinyint(1) DEFAULT NULL,
  `infoAndroidAuto` tinyint(1) DEFAULT NULL,
  `infoAppleCarPlay` tinyint(1) DEFAULT NULL,
  `status` enum('Y','N') DEFAULT 'Y',
  `vehicleId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_tbl_vehicle_infotainment_features` (`vehicleId`),
  CONSTRAINT `fk_tbl_vehicle_infotainment_features` FOREIGN KEY (`vehicleId`) REFERENCES `tbl_vehicles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_vehicle_infotainment_features`
--

LOCK TABLES `tbl_vehicle_infotainment_features` WRITE;
/*!40000 ALTER TABLE `tbl_vehicle_infotainment_features` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_vehicle_infotainment_features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_vehicle_instrumentation_features`
--

DROP TABLE IF EXISTS `tbl_vehicle_instrumentation_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_vehicle_instrumentation_features` (
  `id` int NOT NULL AUTO_INCREMENT,
  `instTachometer` tinyint(1) DEFAULT NULL,
  `instMultiInfo` tinyint(1) DEFAULT NULL,
  `instInfoCluster` tinyint(1) DEFAULT NULL,
  `status` enum('Y','N') DEFAULT 'Y',
  `vehicleId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_tbl_vehicle_instrumentation_features` (`vehicleId`),
  CONSTRAINT `fk_tbl_vehicle_instrumentation_features` FOREIGN KEY (`vehicleId`) REFERENCES `tbl_vehicles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_vehicle_instrumentation_features`
--

LOCK TABLES `tbl_vehicle_instrumentation_features` WRITE;
/*!40000 ALTER TABLE `tbl_vehicle_instrumentation_features` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_vehicle_instrumentation_features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_vehicle_notifications`
--

DROP TABLE IF EXISTS `tbl_vehicle_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_vehicle_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requestId` int NOT NULL,
  `vehicleId` int NOT NULL,
  `notifiedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `requestId` (`requestId`),
  KEY `vehicleId` (`vehicleId`),
  CONSTRAINT `tbl_vehicle_notifications_ibfk_1` FOREIGN KEY (`requestId`) REFERENCES `tbl_vehicle_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_vehicle_notifications_ibfk_2` FOREIGN KEY (`vehicleId`) REFERENCES `tbl_vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_vehicle_notifications`
--

LOCK TABLES `tbl_vehicle_notifications` WRITE;
/*!40000 ALTER TABLE `tbl_vehicle_notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_vehicle_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_vehicle_prices`
--

DROP TABLE IF EXISTS `tbl_vehicle_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_vehicle_prices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicleId` int NOT NULL,
  `exFactoryPrice` decimal(15,2) DEFAULT NULL,
  `withholdingTaxFiler` decimal(15,2) DEFAULT NULL,
  `withholdingTaxNonFiler` decimal(15,2) DEFAULT NULL,
  `payorderPriceFiler` decimal(15,2) DEFAULT NULL,
  `payorderPriceNonFiler` decimal(15,2) DEFAULT NULL,
  `tokenTax` decimal(15,2) DEFAULT NULL,
  `incomeTaxFiler` decimal(15,2) DEFAULT NULL,
  `registrationFee` decimal(15,2) DEFAULT NULL,
  `registrationBook` decimal(15,2) DEFAULT NULL,
  `scanningArchivingFee` decimal(15,2) DEFAULT NULL,
  `stickerFee` decimal(15,2) DEFAULT NULL,
  `numberPlateCharges` decimal(15,2) DEFAULT NULL,
  `totalPriceFiler` decimal(15,2) DEFAULT NULL,
  `totalPriceNonFiler` decimal(15,2) DEFAULT NULL,
  `status` enum('Y','N') DEFAULT 'Y',
  PRIMARY KEY (`id`),
  KEY `vehicleId` (`vehicleId`),
  CONSTRAINT `tbl_vehicle_prices_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `tbl_vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_vehicle_prices`
--

LOCK TABLES `tbl_vehicle_prices` WRITE;
/*!40000 ALTER TABLE `tbl_vehicle_prices` DISABLE KEYS */;
INSERT INTO `tbl_vehicle_prices` VALUES (1,2,2950000.00,25000.00,50000.00,2975000.00,3000000.00,12000.00,15000.00,8000.00,1500.00,1000.00,500.00,2000.00,3033000.00,3058000.00,'Y'),(2,7,10000.00,2000.00,20000.00,120.00,1221.00,834.00,23.00,23.00,2433.00,324.00,12.00,12321.00,17001.00,36102.00,'Y'),(3,7,100.00,100.00,1.00,100.00,1.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,1000.00,801.00,'Y');
/*!40000 ALTER TABLE `tbl_vehicle_prices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_vehicle_requests`
--

DROP TABLE IF EXISTS `tbl_vehicle_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_vehicle_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `vehicleType` varchar(100) DEFAULT NULL,
  `make` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `minPrice` decimal(12,2) DEFAULT NULL,
  `maxPrice` decimal(12,2) DEFAULT NULL,
  `minYear` int DEFAULT NULL,
  `maxYear` int DEFAULT NULL,
  `fuelType` varchar(50) DEFAULT NULL,
  `transmissionType` varchar(50) DEFAULT NULL,
  `colorPreference` varchar(100) DEFAULT NULL,
  `status` enum('Y','N') DEFAULT 'Y',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `tbl_vehicle_requests_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `tbl_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_vehicle_requests`
--

LOCK TABLES `tbl_vehicle_requests` WRITE;
/*!40000 ALTER TABLE `tbl_vehicle_requests` DISABLE KEYS */;
INSERT INTO `tbl_vehicle_requests` VALUES (4,8,'SUV','Toyota','Fortuner',6000000.00,8000000.00,2019,2023,'Diesel','Automatic','Black','Y','2025-04-25 12:20:33','2025-04-25 12:20:33');
/*!40000 ALTER TABLE `tbl_vehicle_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_vehicle_safety_features`
--

DROP TABLE IF EXISTS `tbl_vehicle_safety_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_vehicle_safety_features` (
  `id` int NOT NULL AUTO_INCREMENT,
  `safAirbags` tinyint(1) NOT NULL,
  `safAutoDoorLock` tinyint(1) DEFAULT NULL,
  `safSeatbelts` tinyint(1) DEFAULT NULL,
  `safAntiTheft` tinyint(1) DEFAULT NULL,
  `safDriverBeltWarn` tinyint(1) DEFAULT NULL,
  `safDownhillAssist` tinyint(1) DEFAULT NULL,
  `safPassengerBeltWarn` tinyint(1) DEFAULT NULL,
  `safHillStartAssist` tinyint(1) DEFAULT NULL,
  `safImmobilizer` tinyint(1) DEFAULT NULL,
  `safTractionControl` tinyint(1) DEFAULT NULL,
  `safDoorOpenWarn` tinyint(1) DEFAULT NULL,
  `safVehicleStability` tinyint(1) DEFAULT NULL,
  `safChildLock` tinyint(1) DEFAULT NULL,
  `safRearFogLamp` tinyint(1) DEFAULT NULL,
  `safIsofix` tinyint(1) DEFAULT NULL,
  `safAeb` tinyint(1) DEFAULT NULL,
  `safHighMountStop` tinyint(1) DEFAULT NULL,
  `safBlindSpotDetect` tinyint(1) DEFAULT NULL,
  `safAbs` tinyint(1) DEFAULT NULL,
  `safLdws` tinyint(1) DEFAULT NULL,
  `safEbd` tinyint(1) DEFAULT NULL,
  `safLkas` tinyint(1) DEFAULT NULL,
  `safBrakeAssist` tinyint(1) DEFAULT NULL,
  `status` enum('Y','N') DEFAULT 'Y',
  `vehicleId` int NOT NULL,
  PRIMARY KEY (`id`,`safAirbags`),
  KEY `fk_vehicle_safety_features_vehicle` (`vehicleId`),
  CONSTRAINT `fk_vehicle_safety_features_vehicle` FOREIGN KEY (`vehicleId`) REFERENCES `tbl_vehicles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_vehicle_safety_features`
--

LOCK TABLES `tbl_vehicle_safety_features` WRITE;
/*!40000 ALTER TABLE `tbl_vehicle_safety_features` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_vehicle_safety_features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_vehicle_specifications`
--

DROP TABLE IF EXISTS `tbl_vehicle_specifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_vehicle_specifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicleId` int NOT NULL,
  `engineType` varchar(50) DEFAULT NULL,
  `turboCharger` varchar(50) DEFAULT NULL,
  `displacement` varchar(50) DEFAULT NULL,
  `numberOfCylinders` int DEFAULT NULL,
  `driveTrain` varchar(50) DEFAULT NULL,
  `cylinderConfiguration` varchar(50) DEFAULT NULL,
  `horsePower` varchar(100) DEFAULT NULL,
  `compressionRatio` varchar(20) DEFAULT NULL,
  `torque` varchar(100) DEFAULT NULL,
  `valvesPerCylinder` int DEFAULT NULL,
  `fuelSystem` varchar(50) DEFAULT NULL,
  `valveMechanism` varchar(50) DEFAULT NULL,
  `maxSpeed` varchar(50) DEFAULT NULL,
  `transmissionType` varchar(100) DEFAULT NULL,
  `gearbox` varchar(50) DEFAULT NULL,
  `steeringType` varchar(100) DEFAULT NULL,
  `minTurningRadius` varchar(20) DEFAULT NULL,
  `powerAssisted` varchar(50) DEFAULT NULL,
  `frontSuspension` varchar(100) DEFAULT NULL,
  `rearSuspension` varchar(100) DEFAULT NULL,
  `frontBrakes` varchar(100) DEFAULT NULL,
  `rearBrakes` varchar(100) DEFAULT NULL,
  `wheelType` varchar(50) DEFAULT NULL,
  `tyreSize` varchar(50) DEFAULT NULL,
  `wheelSize` varchar(50) DEFAULT NULL,
  `spareTyre` varchar(20) DEFAULT NULL,
  `pcd` varchar(20) DEFAULT NULL,
  `spareTyreSize` varchar(20) DEFAULT NULL,
  `mileageCity` varchar(20) DEFAULT NULL,
  `mileageHighway` varchar(20) DEFAULT NULL,
  `fuelTankCapacity` varchar(20) DEFAULT NULL,
  `status` enum('Y','N') DEFAULT 'Y',
  PRIMARY KEY (`id`),
  KEY `vehicleId` (`vehicleId`),
  CONSTRAINT `tbl_vehicle_specifications_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `tbl_vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_vehicle_specifications`
--

LOCK TABLES `tbl_vehicle_specifications` WRITE;
/*!40000 ALTER TABLE `tbl_vehicle_specifications` DISABLE KEYS */;
INSERT INTO `tbl_vehicle_specifications` VALUES (1,1,'Petrol','No','1496 cc',4,'FWD','In-Line','118 HP @ 6000 RPM','10.3:1','145 Nm @ 4200 RPM',4,'EFI','DOHC 16 Valves','190 KM/H','Automatic (CVT)','6-speed','Rack & Pinion','5.2 m','Electric','MacPherson Strut','Torsion Beam','Ventilated Discs','Drum','Alloy Wheels','185/65 R15','15 inch','Steel','5x114.3 mm','T115/70D15','13 KM/L','16 KM/L','45 L','Y'),(2,3,'Petrol','No','1496 cc',4,'FWD','In-Line','118 HP @ 6000 RPM','10.3:1','145 Nm @ 4200 RPM',4,'EFI','DOHC 16 Valves','190 KM/H','Automatic (CVT)','6-speed','Rack & Pinion','5.2 m','Electric','MacPherson Strut','Torsion Beam','Ventilated Discs','Drum','Alloy Wheels','185/65 R15','15 inch','Steel','5x114.3 mm','T115/70D15','13 KM/L','16 KM/L','45 L','Y'),(3,9,'Possimus et unde es','Voluptas doloribus v','Labore eu iusto cupi',35,'Quia exercitation es','Consequatur nisi qu','Eum esse nesciunt q','Ad et dolor reiciend','Explicabo Exercitat',50,'Numquam quae qui vel','Eum et cum natus sit','Est voluptate aut do','Sint sunt dolore qu','In vel unde numquam ','Sit aliqua Explicab','Et aliquip magnam qu','No','Nihil quidem proiden','Dicta anim ipsum pos','Occaecat dolore accu','Sed odit blanditiis ','Minus et dolorum eli','Quidem ratione esse ','Voluptate sequi elig','No','Tempor vitae soluta ','Voluptas officiis pr','Labore laboriosam i','Sed amet voluptates','Esse dolor sit neces','Y');
/*!40000 ALTER TABLE `tbl_vehicle_specifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_vehicles`
--

DROP TABLE IF EXISTS `tbl_vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_vehicles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `vin` varchar(17) DEFAULT NULL,
  `year` smallint NOT NULL,
  `make` varchar(50) NOT NULL,
  `model` varchar(50) NOT NULL,
  `series` varchar(50) DEFAULT NULL,
  `bodyStyle` varchar(30) DEFAULT NULL,
  `engine` varchar(100) DEFAULT NULL,
  `transmission` varchar(30) DEFAULT NULL,
  `driveType` varchar(20) DEFAULT NULL,
  `fuelType` varchar(20) DEFAULT NULL,
  `color` varchar(30) DEFAULT NULL,
  `mileage` int DEFAULT NULL,
  `vehicleCondition` enum('new','used','salvage','parts') NOT NULL,
  `keysAvailable` tinyint(1) DEFAULT '0',
  `locationId` varchar(10) NOT NULL,
  `saleStatus` enum('upcoming','live','sold','passed') DEFAULT 'upcoming',
  `auctionDate` datetime DEFAULT NULL,
  `currentBid` int DEFAULT NULL,
  `buyNowPrice` int DEFAULT NULL,
  `vehicleStatus` enum('Y','N') DEFAULT 'Y',
  `image` varchar(255) DEFAULT NULL,
  `certifyStatus` enum('Certified','Non-Certified') DEFAULT NULL,
  `vehicleImages` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vin` (`vin`),
  KEY `tbl_vehicles_ibfk_1` (`userId`),
  CONSTRAINT `tbl_vehicles_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `tbl_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_vehicles`
--

LOCK TABLES `tbl_vehicles` WRITE;
/*!40000 ALTER TABLE `tbl_vehicles` DISABLE KEYS */;
INSERT INTO `tbl_vehicles` VALUES (1,6,'1HGCM82633A123456',2015,'Honda','Civic','EX','Sedan','1.8L I4','Automatic','FWD','Gasoline','White',89000,'used',1,'CA21','live','2023-12-12 11:00:00',10000000,20000000,'N','uploads/vehicles/1749557583948-image.png',NULL,NULL),(2,8,'5XYZUDLB7DG012345',2013,'Kia','Sorento','LX','SUV','3.5L V6','Automatic','AWD','Gasoline','Black Cherry',112450,'salvage',1,'TX78','live','2023-12-10 14:30:00',20000000,30000000,'N','uploads/vehicles/1749557583948-image.png',NULL,NULL),(3,1,'1HGCM82633A023470',1975,'Nemo dolor deserunt ','Do voluptatum velit ','Inventore qui aliqui','Van','Quam voluptates corr','CVT','AWD','Hybrid','Dolores aut voluptat',91,'new',12,'CA21','live','1998-04-25 00:00:00',30000000,40000000,'Y','uploads\\1751967845049-blue.png',NULL,NULL),(4,6,'3FAHP0HA9CR123456',2020,'Toyota','Fortuner','SE','Sedan','2.5L I4','Automatic','FWD','Diesel','Black',124000,'salvage',12,'FL15','sold','2023-12-13 00:00:00',40000000,50000000,'Y','uploads\\1751967668297-whiteCCar.webp',NULL,NULL),(6,8,'1HGCM82633A123450',2016,'Dolores minima nostr','Et voluptate quam en','Consectetur dolorib','Sed ut sit id in s','Aut architecto nostr','Maxime debitis paria','Elit ullamco velit ','Fugit eveniet quae','Et doloremque sint e',2000,'new',3,'2','live','1984-03-10 00:00:00',60000000,70000000,'N','uploads/vehicles/1749557583948-image.png','Certified','[\"uploads/vehicles/1749557583948-vehicleImages.jpeg\",\"uploads/vehicles/1749557583950-vehicleImages.png\",\"uploads/vehicles/1749557583951-vehicleImages.png\"]'),(7,8,'1HGCM82633A123416',2025,'Audi','Cultus','Alto','Sedan','1.8L I4','Automatic','FWD','Diesel','Red',4,'new',3,'1','sold','2025-12-06 00:00:00',70000000,80000000,'Y','uploads\\1751967691475-paradocar.webp','Certified',NULL),(8,8,'TXYZUDLB7DG012345',2025,'Suzuki','GTR','XII','Hatchback','1.8L I9','Manual','FWD','Oil','Pinkish Yellow',12000,'new',3,'Gujranwala','live','2021-12-08 00:00:00',80000000,90000000,'Y','uploads\\1751968011608-whiteCCar.webp','Certified',NULL),(9,8,'1HGCM82633A123410',2021,'Audi','E-Tron','E','Sedan','2.8L I10','Automatic','FWD','Diesel','Black',4,'new',3,'Lahore','sold','2025-12-05 00:00:00',2000000,30000000,'Y','uploads\\1752130425797-whiteCCar.webp','Non-Certified',NULL),(10,1,'787AUYNJJ77676767',2017,'Suzuki','Mehran','M1','Sedan','1.6L B2','Manual','RWD','Petrol','Grey',12,'new',3,'Gujranwala','live','2020-12-12 00:00:00',12000000,1300000,'Y','uploads/1752130665455-blackCar.png','Non-Certified',NULL),(11,1,'SDVSDSDV123131212',2020,'HAVAL','GTR','HH001','SUV','1.6L B2','Manual','RWD','Petrol','Red',12,'new',2,'Gujranwala','live','2025-07-10 00:00:00',12000000,1300000,'Y','uploads/1752131033413-ss.jpg','Certified',NULL),(12,8,'SDVSDSDV123131219',2012,'Lamborgini','LL-4440','LL','Sedan','1.2L V6','Manual','FWD','Diesel','Red',12,'new',1,'Muree','live','2025-07-23 00:00:00',22000000,23000000,'Y','[\"uploads/vehicles/1753268089034-image.png\",\"uploads/vehicles/1753268089046-image.png\",\"uploads/vehicles/1753268089063-image.png\",\"uploads/vehicles/1753268089072-image.png\"]','Certified',NULL),(18,8,'SDVSDSDV123131233',2012,'Lamborgini','LL-4440','LL','Sedan','1.2L V6','Manual','FWD','Diesel','Red',12,'new',1,'Muree','live','2025-07-23 00:00:00',22000000,23000000,'Y','[\"uploads/vehicles/1753272560537-image.png\",\"uploads/vehicles/1753272560549-image.png\",\"uploads/vehicles/1753272560565-image.png\",\"uploads/vehicles/1753272560572-image.png\"]','Certified',NULL),(19,1,'16ADM5R87FM456789',2025,'ewwed','wdwed','wwe','Sedan','123dd','Automatic','awd','diesel','Black',12,'new',0,'sdsdfc','upcoming','2025-08-06 00:00:00',1200000,1400000,'Y','[\"uploads/vehicles/1753701294134-image.jpeg\",\"uploads/vehicles/1753701294135-image.jpeg\",\"uploads/vehicles/1753701294136-image.jpeg\",\"uploads/vehicles/1753701294136-image.jpg\",\"uploads/vehicles/1753701294139-image.jpeg\"]','Certified',NULL);
/*!40000 ALTER TABLE `tbl_vehicles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-28 21:31:18
