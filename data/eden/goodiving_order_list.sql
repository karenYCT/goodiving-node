-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: goodiving
-- ------------------------------------------------------
-- Server version	8.0.38

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
-- Table structure for table `order_list`
--

DROP TABLE IF EXISTS `order_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_list` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `is_paid` tinyint(1) DEFAULT '0',
  `created_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `shipping_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `shipping_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `recipient_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `recipient_email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `recipient_phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `order_list_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_list`
--

LOCK TABLES `order_list` WRITE;
/*!40000 ALTER TABLE `order_list` DISABLE KEYS */;
INSERT INTO `order_list` VALUES (1,1,1,'2024-11-11 10:54:39','LINE PAY','home','台北市','John Doe','john@example.com','123-456-7890'),(2,1,1,'2024-11-12 14:08:29','LINE PAY','home','abc','John Doe','john@example.com','123-456-7890'),(3,1,1,'2024-11-12 17:31:40','LINE PAY','home','BBB','John Doe','john@example.com','123-456-7890'),(4,1,1,'2024-11-12 18:47:34','LINE PAY','home','123','John Doe','john@example.com','123-456-7890'),(5,1,1,'2024-11-12 19:16:57','LINE PAY','home','DDD','John Doe','john@example.com','123-456-7890'),(9,1,1,'2024-11-14 13:38:33','LINE PAY','home','CCC','John Doe','john@example.com','123-456-7890'),(11,1,1,'2024-11-14 13:53:30','LINE PAY','home','AAA','John Doe','john@example.com','123-456-7890'),(12,1,1,'2024-11-14 13:56:52','LINE PAY','home','AAA','John Doe','john@example.com','123-456-7890'),(13,1,1,'2024-11-14 14:00:01','LINE PAY','home','aaa','John Doe','john@example.com','123-456-7890'),(14,1,1,'2024-11-14 16:31:54',NULL,NULL,NULL,NULL,NULL,NULL),(15,208,1,'2024-11-14 17:28:55','LINE PAY','home','AAA','John Doe','john@example.com','123-456-7890'),(21,208,1,'2024-11-16 12:19:27',NULL,NULL,NULL,NULL,NULL,NULL),(22,208,1,'2024-11-16 12:19:40',NULL,NULL,NULL,NULL,NULL,NULL),(23,208,1,'2024-11-16 12:20:01',NULL,NULL,NULL,NULL,NULL,NULL),(24,208,1,'2024-11-16 12:20:21',NULL,NULL,NULL,NULL,NULL,NULL),(25,208,1,'2024-11-16 12:20:52',NULL,NULL,NULL,NULL,NULL,NULL),(26,208,1,'2024-11-16 12:21:16',NULL,NULL,NULL,NULL,NULL,NULL),(27,208,1,'2024-11-16 12:22:45',NULL,NULL,NULL,NULL,NULL,NULL),(28,208,1,'2024-11-16 12:23:01',NULL,NULL,NULL,NULL,NULL,NULL),(29,208,1,'2024-11-16 12:23:48',NULL,NULL,NULL,NULL,NULL,NULL),(30,208,1,'2024-11-16 12:33:08',NULL,NULL,NULL,NULL,NULL,NULL),(31,208,1,'2024-11-16 12:33:25',NULL,NULL,NULL,NULL,NULL,NULL),(32,208,1,'2024-11-16 12:33:37',NULL,NULL,NULL,NULL,NULL,NULL),(33,208,1,'2024-11-16 12:37:42',NULL,NULL,NULL,NULL,NULL,NULL),(34,208,1,'2024-11-16 12:37:56',NULL,NULL,NULL,NULL,NULL,NULL),(35,208,1,'2024-11-16 12:38:15',NULL,NULL,NULL,NULL,NULL,NULL),(36,208,1,'2024-11-16 12:42:49','LINE PAY','home','ABC','John Doe','john@example.com','123-456-7890'),(38,208,1,'2024-11-18 11:51:55','LINE PAY','home','地址資料不完整，請手動輸入','眉玲感','user208@example.com','0933123456'),(39,208,1,'2024-11-18 13:36:16','LINE PAY','home','地址資料不完整，請手動輸入','眉玲感','user208@example.com','0933123456'),(41,208,1,'2024-11-18 14:54:25','LINE PAY','home','地址資料不完整，請手動輸入','眉玲感','user208@example.com','0933123456'),(42,208,1,'2024-11-18 15:31:55','LINE PAY','home','地址資料不完整，請手動輸入','眉玲感','user208@example.com','0933123456');
/*!40000 ALTER TABLE `order_list` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-11-18 15:57:04
