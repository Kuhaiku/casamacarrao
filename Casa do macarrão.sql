CREATE DATABASE  IF NOT EXISTS `casamacarrao` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `casamacarrao`;
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

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '2a0c4163-294c-11f1-ba89-02420a0b1b33:1-1563';

--
-- Dumping data for table `bairros_atendidos`
--

LOCK TABLES `bairros_atendidos` WRITE;
/*!40000 ALTER TABLE `bairros_atendidos` DISABLE KEYS */;
INSERT INTO `bairros_atendidos` VALUES (1,'Centro','Araruama',6.00,1),(2,'XV de Novembro','Araruama',5.00,1),(3,'Mataruna','Araruama',5.00,1),(4,'Iguabinha','Araruama',8.00,1),(5,'Praia Seca','Araruama',15.00,1),(7,'Areal','Araruama',6.00,1);
/*!40000 ALTER TABLE `bairros_atendidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `cash_registers`
--

LOCK TABLES `cash_registers` WRITE;
/*!40000 ALTER TABLE `cash_registers` DISABLE KEYS */;
INSERT INTO `cash_registers` VALUES ('155851ec-0289-4a54-b92b-5b1d8895ce6a','2026-04-22 17:07:49','2026-04-22 17:14:39',26.00,0.00,0.00,26.00,2),('2d17be30-964c-46ae-958b-0d1017cd3fd8','2026-04-20 19:16:21','2026-04-22 16:15:28',25.00,0.00,0.65,25.65,2),('b05bb9fd-af91-4ac9-8fee-02fab621bb84','2026-04-22 16:15:29','2026-04-22 17:07:49',80.90,0.00,0.00,80.90,2);
/*!40000 ALTER TABLE `cash_registers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `financial_entries`
--

LOCK TABLES `financial_entries` WRITE;
/*!40000 ALTER TABLE `financial_entries` DISABLE KEYS */;
INSERT INTO `financial_entries` VALUES ('c11a7466-ddb0-441e-be5a-af96c79b49e6','tip','10% Serviço - Mesa 02',0.65,'2026-04-22 16:08:05',1);
/*!40000 ALTER TABLE `financial_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES ('8098c80d-294f-11f1-a3f4-02420a0b1b3a','Penne','pasta',0,0.00),('8098ca6e-294f-11f1-a3f4-02420a0b1b3a','Spaguetti','pasta',1,0.00),('8098cbde-294f-11f1-a3f4-02420a0b1b3a','Talharim','pasta',1,0.00),('8098cc40-294f-11f1-a3f4-02420a0b1b3a','Parafuso','pasta',1,0.00),('8098cc88-294f-11f1-a3f4-02420a0b1b3a','Nhoque tradicional','pasta',1,0.00),('809adf6f-294f-11f1-a3f4-02420a0b1b3a','Tomate','sauce',1,0.00),('809ae1ef-294f-11f1-a3f4-02420a0b1b3a','Bolonhesa','sauce',1,0.00),('809ae256-294f-11f1-a3f4-02420a0b1b3a','Branco','sauce',1,0.00),('809ae292-294f-11f1-a3f4-02420a0b1b3a','Rose','sauce',1,0.00),('809d1764-294f-11f1-a3f4-02420a0b1b3a','Cebolinha','seasoning',1,0.00),('809d19e2-294f-11f1-a3f4-02420a0b1b3a','Manjericão','seasoning',1,0.00),('809d1a43-294f-11f1-a3f4-02420a0b1b3a','Orégano','seasoning',1,0.00),('809d1a7b-294f-11f1-a3f4-02420a0b1b3a','Salsinha','seasoning',1,0.00),('809d1ab5-294f-11f1-a3f4-02420a0b1b3a','Pimenta Calabresa','seasoning',1,0.00),('809d1af0-294f-11f1-a3f4-02420a0b1b3a','Queijo Parmesão','seasoning',1,0.00),('809f67d1-294f-11f1-a3f4-02420a0b1b3a','Alho','ingredient',1,0.00),('809f6a56-294f-11f1-a3f4-02420a0b1b3a','Alcaparras','ingredient',1,0.00),('809f6aad-294f-11f1-a3f4-02420a0b1b3a','Azeitonas Verdes','ingredient',1,0.00),('809f6aeb-294f-11f1-a3f4-02420a0b1b3a','Brócolis','ingredient',1,0.00),('809f6b2d-294f-11f1-a3f4-02420a0b1b3a','Bacon','ingredient',1,0.00),('809f6b65-294f-11f1-a3f4-02420a0b1b3a','Camarão','ingredient',1,0.00),('809f6b9f-294f-11f1-a3f4-02420a0b1b3a','Cebola','ingredient',1,0.00),('809f6bdb-294f-11f1-a3f4-02420a0b1b3a','Champignons','ingredient',1,0.00),('809f6c11-294f-11f1-a3f4-02420a0b1b3a','Ervilha','ingredient',1,0.00),('809f6c49-294f-11f1-a3f4-02420a0b1b3a','Frango','ingredient',1,0.00),('809f6c80-294f-11f1-a3f4-02420a0b1b3a','Calabresa','ingredient',1,0.00),('809f6cb6-294f-11f1-a3f4-02420a0b1b3a','Milho','ingredient',1,0.00),('809f6cee-294f-11f1-a3f4-02420a0b1b3a','Mussarela','ingredient',1,0.00),('809f6d26-294f-11f1-a3f4-02420a0b1b3a','Salaminho','ingredient',1,0.00),('809f6d5d-294f-11f1-a3f4-02420a0b1b3a','Ovo de Codorna','ingredient',1,0.00),('809f6dca-294f-11f1-a3f4-02420a0b1b3a','Passas','ingredient',1,0.00),('809f6e0b-294f-11f1-a3f4-02420a0b1b3a','Peito de peru','ingredient',1,0.00),('809f6e46-294f-11f1-a3f4-02420a0b1b3a','Presunto','ingredient',1,0.00),('809f6e7d-294f-11f1-a3f4-02420a0b1b3a','Queijo minas','ingredient',1,0.00),('809f6eb4-294f-11f1-a3f4-02420a0b1b3a','Tomate','ingredient',1,0.00),('extra-1775669182900','Queijo Extra','extra',1,8.00);
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES ('0489c9c5-0a60-485c-8f7a-295a13807282','asd','asd','asd, Nº 12 - centro, ','pix','aprovado',0,12.50,'2026-04-22 17:35:46',0,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asd',NULL,'delivery',6.00,0.00,0.00,6.50,0,'2026-04-22 14:35:46'),('0fd8c060-6301-4f08-a35b-f802189e4093','asd123123','asd','asdas11235644415, Nº 15 - centro, ','pix','entregue',1,62.40,'2026-04-22 16:59:45',1,'[{\"id\": \"550f5e52-b34d-4570-a7a2-bba6a2ca0965\", \"extras\": [\"extra-1775669182900\"], \"sauces\": [\"809ae1ef-294f-11f1-a3f4-02420a0b1b3a\", \"809ae256-294f-11f1-a3f4-02420a0b1b3a\"], \"sizeId\": \"g\", \"pastaId\": \"8098cbde-294f-11f1-a3f4-02420a0b1b3a\", \"temperos\": [], \"ingredients\": [\"809f6bdb-294f-11f1-a3f4-02420a0b1b3a\", \"809f6c11-294f-11f1-a3f4-02420a0b1b3a\", \"809f6b65-294f-11f1-a3f4-02420a0b1b3a\"]}]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','12123321','2026-04-22 14:04:34','delivery',1.00,2.00,0.00,59.40,0,'2026-04-22 13:59:45'),('150c8d72-02f5-4cf2-aa33-cbeb084b8e99','asd','2620','asd, Nº 123 - centro, ','pix','entregue',1,12.50,'2026-04-22 17:26:53',0,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asd','2026-04-22 14:27:08','delivery',6.00,0.00,0.00,6.50,0,'2026-04-22 14:26:54'),('73ad529c-e8c4-4d9c-b6e9-99c830bb553d','asd','asd','asdasd, Nº 10 - centro, ','pix','entregue',1,12.50,'2026-04-22 17:09:47',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','','2026-04-22 14:10:05','delivery',6.00,0.00,0.00,6.50,0,'2026-04-22 14:09:48'),('7fe99b32-6872-4650-835a-c6f24f01cfbb','asd1q234','ad4254','aa, Nº 2 - Areal, ','pix','entregue',1,18.50,'2026-04-22 17:06:45',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}, {\"quantity\": 1, \"productId\": \"47b51851-2d3b-11f1-a3f4-02420a0b1b3a\"}]','344rrtfg54r5','2026-04-22 14:07:13','delivery',6.00,0.00,0.00,12.50,0,'2026-04-22 14:06:46'),('8a06235c-2d09-4dab-ad7b-a0e414db220e','asd','das','asd, Nº 12 - centro, ','pix','aprovado',0,12.00,'2026-04-22 17:35:09',0,'[]','[{\"quantity\": 1, \"productId\": \"47b51851-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asdasd',NULL,'delivery',6.00,0.00,0.00,6.00,0,'2026-04-22 14:35:09'),('9e37e19d-a46a-4061-b4dd-d78a902f861c','asd123','Não informado','Mesa 02','dinheiro','entregue',1,6.50,'2026-04-22 16:04:33',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asdasd','2026-04-22 13:08:00','delivery',0.00,0.00,0.00,0.00,1,'2026-04-22 13:07:55'),('c3f8a836-dff6-4d65-a502-3eebfe4ccd3e','sdasdasdasd','asdasdas','asd, Nº 123 - XV de Novembro, ','pix','entregue',1,18.50,'2026-04-22 16:09:31',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}, {\"quantity\": 1, \"productId\": \"47b51111-2d3b-11f1-a3f4-02420a0b1b3a\"}]','ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312','2026-04-22 13:15:08','delivery',0.00,0.00,0.00,0.00,1,'2026-04-22 13:09:31'),('f01df82a-c285-444d-925c-92e727a93bee','das','Não informado','Mesa 02','dinheiro','entregue',1,13.50,'2026-04-22 17:13:11',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}, {\"quantity\": 1, \"productId\": \"47b51111-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asdasd','2026-04-22 14:13:57','delivery',0.00,0.00,0.00,0.00,0,'2026-04-22 14:13:56'),('f2a565d1-9775-49bf-9035-dda9680fc1f4','asdasd','Não informado','Mesa 02','dinheiro','entregue',0,6.50,'2026-04-22 17:28:29',0,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asdasd','2026-04-22 14:30:10','delivery',0.00,0.00,0.00,0.00,0,'2026-04-22 14:30:07');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_categories`
--

LOCK TABLES `product_categories` WRITE;
/*!40000 ALTER TABLE `product_categories` DISABLE KEYS */;
INSERT INTO `product_categories` VALUES ('2431d731-a007-40b2-bef4-31d6f526a443','Pratos Feitos',1,1),('25afddf6-8473-4d19-8290-1c913dfefe3f','Bebidas',1,0);
/*!40000 ALTER TABLE `product_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('2de0e0be-7a68-4d62-b49c-a9cd0b54cf48','2431d731-a007-40b2-bef4-31d6f526a443','Mocoto G',30.00,1,0,'padrao',0.00),('2f00b840-fa93-4694-96d2-7d394ab18844','2431d731-a007-40b2-bef4-31d6f526a443','Angu com Carne Seca G',30.00,1,0,'padrao',0.00),('33e52d1a-7790-4189-a909-0e33b69230b8','2431d731-a007-40b2-bef4-31d6f526a443','Caldo Verde G',29.00,1,0,'padrao',0.00),('4212739c-b210-468b-9bf6-57279c733f7f','2431d731-a007-40b2-bef4-31d6f526a443','Angu com Carne Seca P',28.00,1,0,'padrao',0.00),('47b51111-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Coca-Cola Zero Lata',7.00,1,0,'nenhuma',0.00),('47b515e9-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Guaraná Antarctica Lata',6.50,1,0,'nenhuma',0.00),('47b5177f-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Guaraná Antarctica Zero Lata',6.50,1,0,'nenhuma',0.00),('47b51851-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Sprite Lata',6.00,1,0,'nenhuma',0.00),('47b518e8-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Fanta Laranja Lata',6.00,1,0,'nenhuma',0.00),('47b51984-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Água Mineral sem Gás 500ml',4.00,1,0,'nenhuma',0.00),('47b51a31-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Água Mineral com Gás 500ml',4.50,1,0,'nenhuma',0.00),('47b51ab1-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','H2OH! Limão 500ml',7.50,1,0,'nenhuma',0.00),('47b51b31-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Schweppes Citrus Lata',7.00,1,0,'nenhuma',0.00),('47b51bab-2d3b-11f1-a3f4-02420a0b1b3a','25afddf6-8473-4d19-8290-1c913dfefe3f','Suco Del Valle Uva Lata',8.00,1,0,'nenhuma',0.00),('52c93d5e-e2a1-452d-b30b-b7fda539d519','2431d731-a007-40b2-bef4-31d6f526a443','Caldo Verde P',27.00,1,0,'padrao',0.00),('71034435-a6ee-4c79-b062-4cd5cea84eb9','2431d731-a007-40b2-bef4-31d6f526a443','Inhame com Carne Seca G',35.00,1,0,'padrao',0.00),('7cb5d5b1-d9a3-4bfa-bdb9-f0f438426fd2','2431d731-a007-40b2-bef4-31d6f526a443','Inhame com Carne Seca P',28.00,1,0,'padrao',0.00),('9b75623e-598f-4173-b97d-69133447b150','25afddf6-8473-4d19-8290-1c913dfefe3f','Coca-Cola Lata',7.00,1,0,'nenhuma',0.00),('de03e909-ff09-471a-9740-aa5c134eb63e','2431d731-a007-40b2-bef4-31d6f526a443','Mocoto P',28.00,1,0,'padrao',0.00),('f2bb56f3-d111-4bee-8dbe-035298b3226f','2431d731-a007-40b2-bef4-31d6f526a443','Caldo de Aipim (300g)',35.00,1,0,'padrao',0.00);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `sizes`
--

LOCK TABLES `sizes` WRITE;
/*!40000 ALTER TABLE `sizes` DISABLE KEYS */;
INSERT INTO `sizes` VALUES ('g','G',44.90,1,1,10,0,3,1,2.00),('m','M',41.90,1,1,8,0,2,1,2.00),('p','P',38.90,1,1,4,0,1,1,2.00);
/*!40000 ALTER TABLE `sizes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `store_settings`
--

LOCK TABLES `store_settings` WRITE;
/*!40000 ALTER TABLE `store_settings` DISABLE KEYS */;
INSERT INTO `store_settings` VALUES (1,3.01,8.00,'Olá, {{nome}}, recebemos seu pedido!, Acompanhe o status aqui: {{link}} para efetuar pagamento o nosso pix é  22996196206 o seu total é: {{total}}','2026-04-22 17:14:39',1,15.01,10.01,1,2.00,0,5.00,0.00,0,NULL);
/*!40000 ALTER TABLE `store_settings` ENABLE KEYS */;
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

-- Dump completed on 2026-04-22 14:38:01
