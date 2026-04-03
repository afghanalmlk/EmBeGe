-- Membuat tabel Role
CREATE TABLE role (
    id_role SERIAL PRIMARY KEY,
    nama_role VARCHAR(50) NOT NULL
);

-- Membuat tabel SPPG
CREATE TABLE sppg (
    id_sppg SERIAL PRIMARY KEY,
    nama_sppg VARCHAR(100) NOT NULL,
    provinsi VARCHAR(100),
    kota VARCHAR(100),
    alamat TEXT
);

-- Membuat tabel User
CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    id_role INT REFERENCES role(id_role),
    id_sppg INT REFERENCES sppg(id_sppg),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    no_telp VARCHAR(20)
);

-- uder superadmin: username dev, password: 1234
INSERT INTO users (id_role, id_sppg, username, password, email, no_telp) VALUES (1, NULL, 'dev', '$2b$10$bU2hyuFlOelMQvXrNt1NL.CaacPWrbawH3JhPnDVHHaDWYaaNOEKW', 'dev@sistem.com', '0800000000');

-- Membuat tabel Barang
CREATE TABLE barang (
    id_barang SERIAL PRIMARY KEY,
    nama_barang VARCHAR(100) NOT NULL
);



-- Membuat tabel Menu
CREATE TABLE menu (
    id_menu SERIAL PRIMARY KEY,
    nama_menu VARCHAR(100) NOT NULL
);

-- Membuat tabel Jadwal Menu
CREATE TABLE jadwal_menu (
    id_jadwal SERIAL PRIMARY KEY,
    id_menu INT REFERENCES menu(id_menu) ON DELETE CASCADE,
    id_penerima INT REFERENCES penerima_manfaat(id_penerima) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    qty_porsi_besar INT DEFAULT 0,
    qty_porsi_kecil INT DEFAULT 0,
    created_by INT REFERENCES users(id_user)
);

-- Membuat tabel Detail Menu (sebagai resep/komposisi bahan)
CREATE TABLE detail_menu (
    id_detail_menu SERIAL PRIMARY KEY,
    id_menu INT REFERENCES menu(id_menu),
    id_barang INT REFERENCES barang(id_barang)
);

-- Membuat tabel PO
CREATE TABLE po (
    id_po SERIAL PRIMARY KEY,
    id_jadwal_menu INT REFERENCES jadwal_menu(id_jadwal),
    tanggal_po DATE NOT NULL,
    status_po VARCHAR(50) DEFAULT 'Pending',
    notif BOOLEAN DEFAULT false
);

-- Membuat tabel Detail PO
CREATE TABLE detail_po (
    id_detail_po SERIAL PRIMARY KEY,
    id_po INT REFERENCES po(id_po),
    id_barang INT REFERENCES barang(id_barang),
    qty_barang INT NOT NULL,
    harga_barang INT NOT NULL
);

-- Membuat tabel Histori PO
CREATE TABLE histori_po (
    id_histori SERIAL PRIMARY KEY,
    id_detail_po INT REFERENCES detail_po(id_detail_po),
    action VARCHAR(100),
    action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_by INT REFERENCES users(id_user)
);

-- Membuat tabel Invoice
CREATE TABLE invoice (
    id_invoice SERIAL PRIMARY KEY,
    id_po INT REFERENCES po(id_po),
    tanggal_invoice DATE NOT NULL,
    supplier VARCHAR(100),
    notif BOOLEAN DEFAULT false
);

-- Membuat tabel Detail Invoice
CREATE TABLE detail_invoice (
    id_detail_invoice SERIAL PRIMARY KEY,
    id_invoice INT REFERENCES invoice(id_invoice),
    harga_fix INT NOT NULL,
    satuan VARCHAR(50),
    qty INT NOT NULL
);

-- Memasukkan data awal untuk Role
INSERT INTO role (nama_role) VALUES 
('KaSPPG'), 
('Ahli Gizi'), 
('Akuntan');

-- UPDATE 1
-- Menambahkan kolom created_by untuk melacak kepemilikan data
ALTER TABLE menu ADD COLUMN created_by INT REFERENCES users(id_user);
ALTER TABLE po ADD COLUMN created_by INT REFERENCES users(id_user);
ALTER TABLE invoice ADD COLUMN created_by INT REFERENCES users(id_user);

-- UPDATE 2
-- Mengubah nama kolom kota menjadi kabupaten_kota
ALTER TABLE sppg RENAME COLUMN kota TO kabupaten_kota;

-- Menambahkan kolom kecamatan dan kelurahan/desa
ALTER TABLE sppg ADD COLUMN kecamatan VARCHAR(100);
ALTER TABLE sppg ADD COLUMN kelurahan_desa VARCHAR(100);

-- UPDATE 3
-- 1. Menghapus data user uji coba (agar tabel role tidak terkunci)
DELETE FROM users;

-- 2. Menghapus semua role yang lama
DELETE FROM role;

-- 3. Mengatur ulang nomor ID role agar kembali mulai dari 1
ALTER SEQUENCE role_id_role_seq RESTART WITH 1;

-- 4. Memasukkan role dengan urutan hierarki yang baru
INSERT INTO role (nama_role) VALUES 
('Superadmin'), 
('KaSPPG'), 
('Ahli Gizi'), 
('Akuntan');

-- 1. Membuat Tabel Penerima Manfaat
CREATE TABLE penerima_manfaat (
    id_penerima SERIAL PRIMARY KEY,
    nama_penerima VARCHAR(255) NOT NULL,
    alamat TEXT,
    qty_porsi_besar INT DEFAULT 0,
    qty_porsi_kecil INT DEFAULT 0,
    created_by INT REFERENCES users(id_user)
);

-- 2. Membuat Tabel Gizi
CREATE TABLE gizi (
    id_gizi SERIAL PRIMARY KEY,
    id_menu INT REFERENCES menu(id_menu) ON DELETE CASCADE,
    jenis_porsi VARCHAR(50), 
    energi DECIMAL,
    protein DECIMAL,
    lemak DECIMAL,
    karbo DECIMAL,
    serat DECIMAL
);

-- Perbaikan untuk Detail Menu
ALTER TABLE detail_menu DROP CONSTRAINT detail_menu_id_menu_fkey;
ALTER TABLE detail_menu ADD CONSTRAINT detail_menu_id_menu_fkey FOREIGN KEY (id_menu) REFERENCES menu(id_menu) ON DELETE CASCADE;

-- Perbaikan untuk Detail PO
ALTER TABLE detail_po DROP CONSTRAINT detail_po_id_po_fkey;
ALTER TABLE detail_po ADD CONSTRAINT detail_po_id_po_fkey FOREIGN KEY (id_po) REFERENCES po(id_po) ON DELETE CASCADE;

-- Perbaikan untuk Histori PO
ALTER TABLE histori_po DROP CONSTRAINT histori_po_id_detail_po_fkey;
ALTER TABLE histori_po ADD CONSTRAINT histori_po_id_detail_po_fkey FOREIGN KEY (id_detail_po) REFERENCES detail_po(id_detail_po) ON DELETE CASCADE;

-- Perbaikan untuk Detail Invoice
ALTER TABLE detail_invoice DROP CONSTRAINT detail_invoice_id_invoice_fkey;
ALTER TABLE detail_invoice ADD CONSTRAINT detail_invoice_id_invoice_fkey FOREIGN KEY (id_invoice) REFERENCES invoice(id_invoice) ON DELETE CASCADE;
ALTER TABLE detail_po ADD COLUMN satuan VARCHAR(50);
ALTER TABLE invoice ADD COLUMN status_invoice VARCHAR(50) DEFAULT 'Pending';

-- Tambahan untuk alur approval
ALTER TABLE menu ADD COLUMN status_menu VARCHAR(50) DEFAULT 'Pending Akuntan';
ALTER TABLE menu ADD COLUMN catatan_akuntan TEXT;

-- Tambahan untuk review bahan baku oleh akuntan
ALTER TABLE detail_menu ADD COLUMN qty_standar DECIMAL DEFAULT 0;
ALTER TABLE detail_menu ADD COLUMN satuan VARCHAR(50);
ALTER TABLE detail_menu ADD COLUMN is_approved_akuntan BOOLEAN DEFAULT FALSE;