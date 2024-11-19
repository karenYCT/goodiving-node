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
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `product_variant_id` int NOT NULL,
  `product_id` int NOT NULL,
  `size` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `color` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `stock` int NOT NULL,
  PRIMARY KEY (`product_variant_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product_list` (`product_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (1,13,'S','藍色',10),(2,13,'M','藍色',10),(3,13,'L','黑色',20),(4,14,'S','紅色',5),(5,14,'M','綠色',10),(6,14,'L','藍色',3),(7,14,'S','黃色',7),(8,14,'M','黑色',12),(9,15,'S','ONE COLOR',4),(10,15,'M','ONE COLOR',6),(11,15,'L','ONE COLOR',0),(13,16,'S','灰色',8),(14,16,'M','紅色',15),(15,16,'L','藍色',2),(16,17,'S','綠色',10),(17,17,'M','紫色',3),(18,17,'L','黑色',11),(19,18,'S','黃色',5),(20,18,'M','橙色',0),(21,18,'L','白色',7),(22,18,'S','粉色',12),(23,18,'M','灰色',4),(24,19,'ONE SIZE','ONE COLOR',12),(25,20,'S','紅色',10),(26,20,'M','紅色',10),(27,20,'L','紅色',5),(28,20,'XL','紅色',3),(29,21,'S','藍色',7),(30,21,'M','黑色',4),(31,21,'L','黃色',2),(32,21,'XL','白色',6),(33,22,'ONE SIZE','藍色',8),(34,22,'ONE SIZE','黑色',5),(35,23,'S','白色',6),(36,23,'M','藍色',2),(37,23,'L','黑色',4),(38,24,'ONE SIZE','ONE COLOR',9),(39,25,'S','藍色',10),(40,25,'M','黃色',5),(41,25,'L','黑色',3),(42,25,'XL','白色',7),(43,26,'ONE SIZE','藍色',12),(44,26,'ONE SIZE','黑色',8),(45,27,'S','白色',6),(46,27,'M','藍色',4),(47,27,'L','黃色',2),(48,28,'S','黑色',9),(49,28,'M','白色',5),(50,28,'L','藍色',3),(51,28,'XL','黃色',1),(52,29,'ONE SIZE','ONE COLOR',11),(53,30,'S','藍色',8),(54,30,'M','黑色',6),(55,30,'L','黃色',4),(56,31,'ONE SIZE','藍色',10),(57,31,'ONE SIZE','黑色',5),(58,32,'S','白色',8),(59,32,'M','黃色',4),(60,32,'L','藍色',6),(61,32,'XL','黑色',3),(62,33,'S','黑色',7),(63,33,'M','白色',5),(64,33,'L','藍色',2),(65,34,'ONE SIZE','黃色',12),(66,35,'S','藍色',6),(67,35,'M','黑色',3),(68,35,'L','白色',9),(69,35,'XL','黃色',1),(70,36,'ONE SIZE','ONE COLOR',8),(71,37,'ONE SIZE','ONE COLOR',15),(72,38,'ONE SIZE','ONE COLOR',10),(73,39,'ONE SIZE','ONE COLOR',12),(74,40,'ONE SIZE','ONE COLOR',8),(75,41,'ONE SIZE','ONE COLOR',14),(76,42,'ONE SIZE','ONE COLOR',11),(77,43,'ONE SIZE','ONE COLOR',9),(78,44,'ONE SIZE','ONE COLOR',13),(79,45,'ONE SIZE','ONE COLOR',7),(80,46,'ONE SIZE','ONE COLOR',15),(81,47,'ONE SIZE','ONE COLOR',11),(82,48,'ONE SIZE','ONE COLOR',5),(83,49,'ONE SIZE','ONE COLOR',12),(84,13,'S','黑色',0),(85,13,'S','白色',10),(86,13,'S','黃色',10),(87,13,'M','黑色',5),(88,13,'M','白色',10),(89,13,'M','黃色',10),(90,13,'L','藍色',5),(91,13,'L','白色',10),(92,13,'L','黃色',10),(93,14,'S','黑色',0),(94,14,'S','白色',10),(95,14,'S','綠色',10),(96,14,'M','黑色',0),(97,14,'M','白色',0),(98,14,'M','黃色',10),(99,14,'L','黑色',0),(100,14,'L','白色',10),(101,14,'L','綠色',10);
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-11-17 16:59:37
