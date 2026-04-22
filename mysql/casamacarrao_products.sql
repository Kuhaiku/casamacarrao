-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: 136.248.87.149    Database: casamacarrao
-- ------------------------------------------------------
-- Server version	9.6.0

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
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '2a0c4163-294c-11f1-ba89-02420a0b1b33:1-1642';

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` varchar(36) NOT NULL,
  `categoryId` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `tem_embalagem` tinyint(1) DEFAULT '0',
  `tipoEmbalagem` varchar(20) DEFAULT 'nenhuma',
  `taxaEmbalagem` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `product_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('2de0e0be-7a68-4d62-b49c-a9cd0b54cf48','2431d731-a007-40b2-bef4-31d6f526a443','Mocoto G',30.00,1,0,'padrao',0.00),('2f00b840-fa93-4694-96d2-7d394ab18844','2431d731-a007-40b2-bef4-31d6f526a443','Angu com Carne Seca G',30.00,1,0,'padrao',0.00),('33e52d1a-7790-4189-a909-0e33b69230b8','2431d731-a007-40b2-bef4-31d6f526a443','Caldo Verde G',29.00,1,0,'padrao',0.00),('4212739c-b210-468b-9bf6-57279c733f7f','2431d731-a007-40b2-bef4-31d6f526a443','Angu com Carne Seca P',28.00,1,0,'padrao',0.00),('47b51111-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Coca-Cola Zero Lata',7.00,1,0,'nenhuma',0.00),('47b515e9-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Guaraná Antarctica Lata',6.50,1,0,'nenhuma',0.00),('47b5177f-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Guaraná Antarctica Zero Lata',6.50,1,0,'nenhuma',0.00),('47b51851-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Sprite Lata',6.00,1,0,'nenhuma',0.00),('47b518e8-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Fanta Laranja Lata',6.00,1,0,'nenhuma',0.00),('47b51984-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Água Mineral sem Gás 500ml',4.00,1,0,'nenhuma',0.00),('47b51a31-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Água Mineral com Gás 500ml',4.50,1,0,'nenhuma',0.00),('47b51ab1-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','H2OH! Limão 500ml',7.50,1,0,'nenhuma',0.00),('47b51b31-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Schweppes Citrus Lata',7.00,1,0,'nenhuma',0.00),('47b51bab-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Suco Del Valle Uva Lata',8.00,1,0,'nenhuma',0.00),('52c93d5e-e2a1-452d-b30b-b7fda539d519','2431d731-a007-40b2-bef4-31d6f526a443','Caldo Verde P',27.00,1,0,'padrao',0.00),('71034435-a6ee-4c79-b062-4cd5cea84eb9','2431d731-a007-40b2-bef4-31d6f526a443','Inhame com Carne Seca G',35.00,1,0,'padrao',0.00),('7cb5d5b1-d9a3-4bfa-bdb9-f0f438426fd2','2431d731-a007-40b2-bef4-31d6f526a443','Inhame com Carne Seca P',28.00,1,0,'padrao',0.00),('9b75623e-598f-4173-b97d-69133447b150','25afddf6-8473-4d19-8290-1c913dfefe3f','Coca-Cola Lata',7.00,1,0,'nenhuma',0.00),('de03e909-ff09-471a-9740-aa5c134eb63e','2431d731-a007-40b2-bef4-31d6f526a443','Mocoto P',28.00,1,0,'padrao',0.00),('f2bb56f3-d111-4bee-8dbe-035298b3226f','2431d731-a007-40b2-bef4-31d6f526a443','Caldo de Aipim (300g)',35.00,1,0,'padrao',0.00);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-22 15:43:36
