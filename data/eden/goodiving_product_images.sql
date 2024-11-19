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
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `image_id` int NOT NULL,
  `product_id` int NOT NULL,
  `img_url` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`image_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product_list` (`product_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (1,13,'/products/mask/1.webp'),(2,13,'/products/mask/1-1.webp'),(3,13,'/products/mask/1-2.webp'),(4,13,'/products/mask/1-3.webp'),(5,13,'/products/mask/1-4.webp'),(6,14,'/products/mask/2.webp'),(7,14,'/products/mask/2-1.webp'),(8,14,'/products/mask/2-2.webp'),(9,14,'/products/mask/2-3.webp'),(10,14,'/products/mask/2-4.webp'),(11,15,'/products/mask/3.webp'),(12,15,'/products/mask/3-1.webp'),(13,15,'/products/mask/3-2.webp'),(14,15,'/products/mask/3-3.webp'),(15,15,'/products/mask/3-4.webp'),(16,15,'/products/mask/3-5.webp'),(17,16,'/products/mask/4.webp'),(18,16,'/products/mask/4-1.webp'),(19,17,'/products/mask/5.webp'),(20,17,'/products/mask/5-1.webp'),(21,17,'/products/mask/5-2.webp'),(22,18,'/products/mask/6.webp'),(23,19,'/products/wetsuit/1.webp'),(24,20,'/products/wetsuit/2.webp'),(25,21,'/products/wetsuit/3.webp'),(26,22,'/products/wetsuit/4.webp'),(27,23,'/products/wetsuit/5.webp'),(28,24,'/products/wetsuit/6.webp'),(29,25,'/products/fins/1.webp'),(30,26,'/products/fins/2.webp'),(31,27,'/products/fins/3.webp'),(32,28,'/products/fins/4.webp'),(33,29,'/products/fins/5.webp'),(34,30,'/products/fins/6.webp'),(35,31,'/products/boots/1.webp'),(36,32,'/products/boots/2.webp'),(37,33,'/products/boots/3.webp'),(38,34,'/products/boots/4.webp'),(39,35,'/products/boots/5.webp'),(40,36,'/products/boots/6.webp'),(41,37,'/products/regulator/1.webp'),(42,38,'/products/regulator/2.webp'),(43,39,'/products/regulator/3.webp'),(44,40,'/products/regulator/4.webp'),(45,41,'/products/regulator/5.webp'),(46,42,'/products/regulator/6.webp'),(47,43,'/products/accessory/1.webp'),(48,44,'/products/accessory/2.webp'),(49,45,'/products/accessory/3.webp'),(50,46,'/products/accessory/4.webp'),(51,47,'/products/accessory/5.webp'),(52,48,'/products/accessory/6.webp'),(53,49,'/products/accessory/7.webp');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
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
