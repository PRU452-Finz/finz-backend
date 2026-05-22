/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.6-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: finz_db
-- ------------------------------------------------------
-- Server version	11.8.6-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `category` enum('makanan','transport','hiburan','belanja','tagihan','pendidikan','kesehatan','lainnya') NOT NULL,
  `limit_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `month` varchar(7) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `budgets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
INSERT INTO `budgets` VALUES
(18,1,'makanan',3000000.00,'2026-05','2026-05-18 02:47:12','2026-05-21 02:53:51'),
(19,1,'transport',500000.00,'2026-05','2026-05-18 02:47:12','2026-05-19 23:15:03'),
(20,1,'hiburan',500000.00,'2026-05','2026-05-18 02:47:12','2026-05-19 23:15:05'),
(21,1,'belanja',1000000.00,'2026-05','2026-05-18 02:47:12','2026-05-18 02:47:12'),
(22,1,'tagihan',1000000.00,'2026-05','2026-05-18 02:47:12','2026-05-18 02:47:12'),
(24,1,'kesehatan',500000.00,'2026-05','2026-05-18 02:47:12','2026-05-18 02:47:12'),
(34,7,'makanan',1500000.00,'2026-05','2026-05-20 01:09:22','2026-05-20 01:09:22'),
(35,7,'transport',500000.00,'2026-05','2026-05-20 01:09:22','2026-05-20 01:09:22'),
(36,7,'tagihan',1000000.00,'2026-05','2026-05-20 01:09:22','2026-05-20 01:09:22'),
(37,8,'makanan',800000.00,'2026-05','2026-05-20 01:09:23','2026-05-20 01:09:23'),
(38,8,'hiburan',500000.00,'2026-05','2026-05-20 01:09:23','2026-05-20 01:09:23'),
(39,8,'belanja',500000.00,'2026-05','2026-05-20 01:09:23','2026-05-20 01:09:23'),
(40,9,'makanan',3000000.00,'2026-05','2026-05-20 01:09:23','2026-05-20 01:09:23'),
(41,9,'lainnya',4000000.00,'2026-05','2026-05-20 01:09:23','2026-05-20 01:09:23'),
(42,9,'kesehatan',1500000.00,'2026-05','2026-05-20 01:09:23','2026-05-20 01:09:23'),
(43,10,'makanan',5000000.00,'2026-05','2026-05-20 01:09:24','2026-05-20 01:09:24'),
(44,10,'transport',3000000.00,'2026-05','2026-05-20 01:09:24','2026-05-20 01:09:24'),
(45,10,'hiburan',5000000.00,'2026-05','2026-05-20 01:09:24','2026-05-20 01:09:24');
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `prediction_logs`
--

DROP TABLE IF EXISTS `prediction_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `prediction_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `input_text` varchar(500) NOT NULL COMMENT 'Teks deskripsi yang di-input user',
  `predicted_category` varchar(50) NOT NULL COMMENT 'Kategori hasil prediksi AI/rule-based',
  `confidence` decimal(3,2) DEFAULT NULL COMMENT 'Skor kepercayaan prediksi (0.00 – 1.00)',
  `model_version` varchar(20) DEFAULT 'rule-v1' COMMENT 'Versi model yang digunakan',
  `user_overridden` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Apakah user mengganti prediksi?',
  `final_category` varchar(50) DEFAULT NULL COMMENT 'Kategori akhir yang dipakai (bisa sama atau beda dengan prediksi)',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `prediction_logs_predicted_category` (`predicted_category`),
  KEY `prediction_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prediction_logs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `prediction_logs` WRITE;
/*!40000 ALTER TABLE `prediction_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `prediction_logs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL DEFAULT 1 COMMENT 'ID pengguna pemilik transaksi',
  `amount` decimal(15,2) NOT NULL COMMENT 'Nominal transaksi dalam Rupiah',
  `category` enum('makanan','transport','hiburan','belanja','tagihan','pendidikan','kesehatan','pemasukan','gaji','bonus','investasi','lainnya') NOT NULL COMMENT 'Kategori pengeluaran atau pemasukan',
  `description` varchar(255) NOT NULL DEFAULT '' COMMENT 'Deskripsi singkat transaksi',
  `payment_method` enum('cash','debit','credit','ewallet','transfer','qris') NOT NULL DEFAULT 'cash' COMMENT 'Metode pembayaran',
  `date` date NOT NULL COMMENT 'Tanggal transaksi (YYYY-MM-DD)',
  `created_at` datetime NOT NULL,
  `transaction_type` enum('expense','income') NOT NULL DEFAULT 'expense' COMMENT 'Jenis transaksi: pengeluaran atau pemasukan',
  `hour_of_day` tinyint(3) unsigned DEFAULT NULL COMMENT 'Jam transaksi (0-23), untuk analisis pola waktu',
  `is_recurring` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Apakah transaksi ini berulang setiap bulan?',
  PRIMARY KEY (`id`),
  KEY `transactions_user_id` (`user_id`),
  KEY `transactions_category` (`category`),
  KEY `transactions_date` (`date`),
  KEY `transactions_transaction_type` (`transaction_type`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=259 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES
(163,1,5000000.00,'gaji','Gaji part-time kantor','transfer','2026-05-01','2026-05-01 08:00:00','income',NULL,0),
(164,1,2000000.00,'pemasukan','Uang saku dari orang tua','transfer','2026-05-01','2026-05-01 08:00:00','income',NULL,0),
(165,1,500000.00,'bonus','Bonus project freelance','transfer','2026-05-10','2026-05-10 08:00:00','income',NULL,0),
(166,1,35000.00,'makanan','Makan siang nasi padang','ewallet','2026-05-01','2026-05-01 08:00:00','expense',NULL,0),
(167,1,25000.00,'makanan','Kopi di Starbucks','cash','2026-05-02','2026-05-02 08:00:00','expense',NULL,0),
(168,1,45000.00,'makanan','Makan malam di warteg','qris','2026-05-03','2026-05-03 08:00:00','expense',NULL,0),
(169,1,28000.00,'makanan','Beli makan di kantin kampus','cash','2026-05-04','2026-05-04 08:00:00','expense',NULL,0),
(170,1,55000.00,'makanan','Makan sushi di resto Jepang','qris','2026-05-05','2026-05-05 08:00:00','expense',NULL,0),
(171,1,40000.00,'makanan','Beli bakso dan es teh','cash','2026-05-06','2026-05-06 08:00:00','expense',NULL,0),
(172,1,65000.00,'makanan','Dinner di McDonalds','qris','2026-05-07','2026-05-07 08:00:00','expense',NULL,0),
(173,1,18000.00,'makanan','Sarapan bubur ayam','cash','2026-05-08','2026-05-08 08:00:00','expense',NULL,0),
(174,1,42000.00,'makanan','Makan ayam geprek','ewallet','2026-05-09','2026-05-09 08:00:00','expense',NULL,0),
(175,1,150000.00,'makanan','Makan bersama teman di resto','ewallet','2026-05-10','2026-05-10 08:00:00','expense',NULL,0),
(176,1,32000.00,'makanan','Beli cimol dan cireng','cash','2026-05-11','2026-05-11 08:00:00','expense',NULL,0),
(177,1,85000.00,'makanan','GrabFood nasi goreng seafood','qris','2026-05-12','2026-05-12 08:00:00','expense',NULL,0),
(178,1,200000.00,'makanan','All you can eat BBQ','ewallet','2026-05-13','2026-05-13 08:00:00','expense',NULL,0),
(179,1,35000.00,'makanan','Beli nasi kuning pagi','cash','2026-05-14','2026-05-14 08:00:00','expense',NULL,0),
(180,1,120000.00,'makanan','Beli pizza delivery','ewallet','2026-05-15','2026-05-15 08:00:00','expense',NULL,0),
(181,1,45000.00,'makanan','Makan soto di pinggir jalan','cash','2026-05-16','2026-05-16 08:00:00','expense',NULL,0),
(182,1,200000.00,'makanan','Dinner anniversary di kafe','qris','2026-05-17','2026-05-17 08:00:00','expense',NULL,0),
(183,1,15000.00,'transport','Gojek ke kampus','ewallet','2026-05-01','2026-05-01 08:00:00','expense',NULL,0),
(184,1,12000.00,'transport','Grab ke mall','ewallet','2026-05-03','2026-05-03 08:00:00','expense',NULL,0),
(185,1,20000.00,'transport','Gojek pulang dari gym','ewallet','2026-05-05','2026-05-05 08:00:00','expense',NULL,0),
(186,1,22000.00,'transport','Naik Grab ke stasiun','ewallet','2026-05-07','2026-05-07 08:00:00','expense',NULL,0),
(187,1,50000.00,'transport','Isi bensin motor','cash','2026-05-09','2026-05-09 08:00:00','expense',NULL,0),
(188,1,8000.00,'transport','Naik angkot ke kampus','ewallet','2026-05-11','2026-05-11 08:00:00','expense',NULL,0),
(189,1,70000.00,'transport','Grab Car ke bandara','ewallet','2026-05-13','2026-05-13 08:00:00','expense',NULL,0),
(190,1,100000.00,'transport','Bayar parkir dan bensin','cash','2026-05-15','2026-05-15 08:00:00','expense',NULL,0),
(191,1,50000.00,'hiburan','Nonton bioskop','ewallet','2026-05-02','2026-05-02 08:00:00','expense',NULL,0),
(192,1,75000.00,'hiburan','Langganan Spotify Premium','ewallet','2026-05-04','2026-05-04 08:00:00','expense',NULL,0),
(193,1,100000.00,'hiburan','Top up game Mobile Legends','debit','2026-05-08','2026-05-08 08:00:00','expense',NULL,0),
(194,1,50000.00,'hiburan','Langganan Netflix','ewallet','2026-05-12','2026-05-12 08:00:00','expense',NULL,0),
(195,1,200000.00,'hiburan','Beli tiket konser musik','debit','2026-05-16','2026-05-16 08:00:00','expense',NULL,0),
(196,1,120000.00,'belanja','Beli baju di Uniqlo','debit','2026-05-02','2026-05-02 08:00:00','expense',NULL,0),
(197,1,85000.00,'belanja','Belanja skincare di Sociolla','ewallet','2026-05-06','2026-05-06 08:00:00','expense',NULL,0),
(198,1,180000.00,'belanja','Beli case HP dan aksesoris','credit','2026-05-10','2026-05-10 08:00:00','expense',NULL,0),
(199,1,250000.00,'belanja','Beli earbuds di Tokopedia','ewallet','2026-05-14','2026-05-14 08:00:00','expense',NULL,0),
(200,1,200000.00,'tagihan','Bayar kuota internet bulanan','transfer','2026-05-03','2026-05-03 08:00:00','expense',NULL,0),
(201,1,300000.00,'tagihan','Bayar listrik kosan','transfer','2026-05-09','2026-05-09 08:00:00','expense',NULL,0),
(202,1,200000.00,'tagihan','Bayar air PDAM','transfer','2026-05-15','2026-05-15 08:00:00','expense',NULL,0),
(203,1,350000.00,'pendidikan','Beli buku kuliah semester ini','transfer','2026-05-05','2026-05-05 08:00:00','expense',NULL,0),
(204,1,150000.00,'pendidikan','Beli alat tulis dan print','ewallet','2026-05-12','2026-05-12 08:00:00','expense',NULL,0),
(205,1,150000.00,'kesehatan','Beli vitamin dan obat','debit','2026-05-04','2026-05-04 08:00:00','expense',NULL,0),
(206,1,90000.00,'kesehatan','Gym membership mingguan','debit','2026-05-10','2026-05-10 08:00:00','expense',NULL,0),
(207,1,100000.00,'kesehatan','Beli obat flu di apotek','cash','2026-05-16','2026-05-16 08:00:00','expense',NULL,0),
(208,1,30000.00,'lainnya','Fotocopy tugas kuliah','cash','2026-05-11','2026-05-11 08:00:00','expense',NULL,0),
(209,1,50000.00,'lainnya','Cuci baju laundry','ewallet','2026-05-14','2026-05-14 08:00:00','expense',NULL,0),
(210,1,5000000.00,'gaji','Gaji part-time','transfer','2026-04-01','2026-04-01 08:00:00','income',NULL,0),
(211,1,2000000.00,'pemasukan','Uang saku orang tua','transfer','2026-04-01','2026-04-01 08:00:00','income',NULL,0),
(212,1,450000.00,'belanja','Belanja bulanan supermarket','credit','2026-04-05','2026-04-05 08:00:00','expense',NULL,0),
(213,1,200000.00,'tagihan','Bayar listrik bulan lalu','transfer','2026-04-10','2026-04-10 08:00:00','expense',NULL,0),
(214,1,150000.00,'makanan','Makan bersama teman','ewallet','2026-04-15','2026-04-15 08:00:00','expense',NULL,0),
(215,1,800000.00,'makanan','Makan sebulan awal','cash','2026-04-20','2026-04-20 08:00:00','expense',NULL,0),
(216,1,75000.00,'hiburan','Spotify + Netflix','ewallet','2026-04-12','2026-04-12 08:00:00','expense',NULL,0),
(217,1,300000.00,'tagihan','Bayar air + internet','transfer','2026-04-08','2026-04-08 08:00:00','expense',NULL,0),
(218,1,100000.00,'transport','Transport sebulan','ewallet','2026-04-18','2026-04-18 08:00:00','expense',NULL,0),
(219,1,5000000.00,'gaji','Gaji part-time','transfer','2026-03-01','2026-03-01 08:00:00','income',NULL,0),
(220,1,2000000.00,'pemasukan','Uang saku','transfer','2026-03-01','2026-03-01 08:00:00','income',NULL,0),
(221,1,500000.00,'pendidikan','Bayar UKT semester genap','transfer','2026-03-01','2026-03-01 08:00:00','expense',NULL,0),
(222,1,250000.00,'tagihan','Bayar listrik 2 bln lalu','transfer','2026-03-10','2026-03-10 08:00:00','expense',NULL,0),
(223,1,600000.00,'makanan','Makan sebulan','cash','2026-03-15','2026-03-15 08:00:00','expense',NULL,0),
(224,1,200000.00,'belanja','Belanja online','ewallet','2026-03-20','2026-03-20 08:00:00','expense',NULL,0),
(225,1,75000.00,'hiburan','Streaming langganan','ewallet','2026-03-05','2026-03-05 08:00:00','expense',NULL,0),
(226,1,7000.00,'makanan','beli makan','debit','2026-05-19','2026-05-19 23:05:38','expense',NULL,0),
(227,1,1000000.00,'makanan','bel makan di warung','ewallet','2026-05-19','2026-05-20 00:01:46','expense',NULL,0),
(228,1,1000000.00,'gaji','bonus','cash','2026-05-19','2026-05-20 00:26:15','income',NULL,0),
(229,1,2000000.00,'gaji','gaji bulanan','ewallet','2026-05-13','2026-05-20 00:28:23','income',NULL,0),
(230,1,600000.00,'bonus','bonus','ewallet','2026-05-13','2026-05-20 00:29:33','income',NULL,0),
(239,7,8000000.00,'gaji','Gaji Bulanan','cash','2026-05-01','2026-05-20 01:09:22','income',NULL,0),
(240,7,50000.00,'makanan','Makan Siang Murah','cash','2026-05-02','2026-05-20 01:09:22','expense',NULL,0),
(241,7,200000.00,'tagihan','Listrik','cash','2026-05-05','2026-05-20 01:09:22','expense',NULL,0),
(242,7,100000.00,'transport','Bensin','cash','2026-05-10','2026-05-20 01:09:22','expense',NULL,0),
(243,8,2500000.00,'pemasukan','Uang Saku','cash','2026-05-01','2026-05-20 01:09:23','income',NULL,0),
(244,8,750000.00,'hiburan','Konser Musik (Overbudget)','cash','2026-05-05','2026-05-20 01:09:23','expense',NULL,0),
(245,8,1200000.00,'belanja','Sepatu Baru (Overbudget)','cash','2026-05-12','2026-05-20 01:09:23','expense',NULL,0),
(246,8,400000.00,'makanan','Nongkrong Cafe','cash','2026-05-15','2026-05-20 01:09:23','expense',NULL,0),
(247,9,12000000.00,'gaji','Project Web Development','cash','2026-05-01','2026-05-20 01:09:23','income',NULL,0),
(248,9,5000000.00,'lainnya','Beli Saham','cash','2026-05-03','2026-05-20 01:09:23','expense',NULL,0),
(249,9,800000.00,'kesehatan','Check-up & Vitamin','cash','2026-05-08','2026-05-20 01:09:23','expense',NULL,0),
(250,9,150000.00,'makanan','Salad & Healthy Food','cash','2026-05-12','2026-05-20 01:09:23','expense',NULL,0),
(251,10,25000000.00,'pemasukan','Profit Bisnis Coffee Shop','cash','2026-05-01','2026-05-20 01:09:24','income',NULL,0),
(252,10,4000000.00,'hiburan','Party & Karaoke','cash','2026-05-05','2026-05-20 01:09:24','expense',NULL,0),
(253,10,6000000.00,'makanan','Fine Dining Bisnis (Over Limit)','cash','2026-05-10','2026-05-20 01:09:24','expense',NULL,0),
(254,10,2500000.00,'transport','Servis Mobil','cash','2026-05-14','2026-05-20 01:09:24','expense',NULL,0),
(255,10,50000.00,'makanan','beli makan di mall','ewallet','2026-05-20','2026-05-20 01:14:20','expense',NULL,0),
(256,10,100000.00,'makanan','makan mie','ewallet','2026-05-17','2026-05-20 01:26:01','expense',NULL,0),
(257,8,500000.00,'belanja','beli mobil','ewallet','2026-05-19','2026-05-20 02:28:12','expense',NULL,0),
(258,1,500000.00,'makanan','nasi padang buat makan','ewallet','2026-05-20','2026-05-21 02:56:51','expense',NULL,0);
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `monthly_income` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Pemasukan bulanan user (Rp)',
  `age` int(11) DEFAULT NULL,
  `occupation` enum('mahasiswa','karyawan','freelancer','wirausaha','lainnya') NOT NULL DEFAULT 'karyawan',
  `financial_goal` enum('hemat','investasi','bebas_utang','dana_darurat') NOT NULL DEFAULT 'dana_darurat',
  `risk_profile` enum('konservatif','moderat','agresif') NOT NULL DEFAULT 'konservatif',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `password` varchar(255) NOT NULL COMMENT 'Hashed password (bcrypt)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'Bayu','bayu@finz.id',7000000.00,21,'mahasiswa','hemat','moderat','2026-05-18 02:47:12','2026-05-19 23:15:06','$2b$12$7Z15YH6EzC7HRW5uj0r7D.0JVsIWCYd3f866pZCs73LvnvL7PvnNm'),
(2,'Masbay','masbay@example.com',3500000.00,22,'mahasiswa','dana_darurat','konservatif','2026-05-18 02:47:12','2026-05-18 02:47:12','$2b$12$LrTn1MY0y7YGp7LYr7d/Uufi3Hkv6n.6nvatym5Q5wHqtCaAbMRPu'),
(7,'Junardi','junardi@finz.id',8000000.00,26,'karyawan','hemat','konservatif','2026-05-20 01:09:22','2026-05-20 01:09:22','$2b$12$4lny0enwiXlK1stF.qBtVuJ/UdeUNsGknaFiuwOPrWqhVAv67J.o6'),
(8,'Ashley','ashley@finz.id',2500000.00,20,'mahasiswa','hemat','moderat','2026-05-20 01:09:22','2026-05-20 01:09:22','$2b$12$pN0yHMpFn6bfDCxcPmWGxOJNwxvbW9qPiK4DW42ZZ/USEKEsYfPVi'),
(9,'Cindy','cindy@finz.id',12000000.00,24,'freelancer','investasi','agresif','2026-05-20 01:09:23','2026-05-20 01:09:23','$2b$12$Mqq8Ckk7LkrXbejvm6axgeFdKQDr5AhDs.eNnruqXEa4Q7DnKDz5.'),
(10,'Zulhan','zulhan@finz.id',25000000.00,27,'wirausaha','dana_darurat','moderat','2026-05-20 01:09:23','2026-05-20 01:09:23','$2b$12$IkVGVha/.dWxP4eeoVr4VOJ3kM7bmAfcVF00iF6rxo.6TAn0rorv2');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-05-21  4:16:08
