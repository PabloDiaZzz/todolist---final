-- data.sql

-- Insertar Usuarios si no existen (contraseñas son: <Usuario>.123 generadas con BCrypt)
INSERT IGNORE INTO usuario (full_name, username, email, password, role) VALUES 
('Andrés Admin', 'admin', 'admin@example.com', '$2a$10$DdtJkm5Xnuj04oE2WRRpAOmyFZWHZSJy994RXwF.sSeDO99NGK5mO', 'ROLE_ADMIN'),
('Juan Pérez', 'user', 'user@example.com', '$2a$10$Yd6SxDErzdMhpB4uDIrah.ywCtCrvZcD82Omclpec1qiixMiZ8kE.', 'ROLE_USER'),
('Carlos Gestor', 'gestor', 'gestor@example.com', '$2a$10$409L8JBDzl1JcmuY6hIS.u1f0JUisCbjUb/Gg8HwUpc.zSfvhKyMu', 'ROLE_MANAGER');

-- Insertar Tareas de ejemplo para cada usuario solo si no existen previamente
INSERT INTO task (created_at, last_edit, title, description, completed, author_id)
SELECT NOW(), NOW(), 'Configurar sistema', 'Revisar la configuración inicial del sistema', false, id FROM usuario WHERE username = 'admin'
AND NOT EXISTS (SELECT 1 FROM task WHERE title = 'Configurar sistema' AND author_id IN (SELECT id FROM usuario WHERE username = 'admin')) LIMIT 1;

INSERT INTO task (created_at, last_edit, title, description, completed, author_id)
SELECT NOW(), NOW(), 'Aprobar usuarios', 'Revisar la lista de nuevos registros y aprobar accesos', true, id FROM usuario WHERE username = 'admin'
AND NOT EXISTS (SELECT 1 FROM task WHERE title = 'Aprobar usuarios' AND author_id IN (SELECT id FROM usuario WHERE username = 'admin')) LIMIT 1;

INSERT INTO task (created_at, last_edit, title, description, completed, author_id)
SELECT NOW(), NOW(), 'Completar perfil', 'Añadir foto y actualizar datos personales', false, id FROM usuario WHERE username = 'user'
AND NOT EXISTS (SELECT 1 FROM task WHERE title = 'Completar perfil' AND author_id IN (SELECT id FROM usuario WHERE username = 'user')) LIMIT 1;

INSERT INTO task (created_at, last_edit, title, description, completed, author_id)
SELECT NOW(), NOW(), 'Revisar dashboard', 'Verificar que las estadísticas se muestran correctamente', false, id FROM usuario WHERE username = 'gestor'
AND NOT EXISTS (SELECT 1 FROM task WHERE title = 'Revisar dashboard' AND author_id IN (SELECT id FROM usuario WHERE username = 'gestor')) LIMIT 1;

-- Insertar Categorías
INSERT IGNORE INTO category (title) VALUES 
('Trabajo'), ('Personal'), ('Urgente'), ('Ocio'), ('Salud'), 
('Hogar'), ('Estudios'), ('Finanzas'), ('Proyectos'), ('Ideas');

-- Vincular Categorías a Tareas
-- Asumiendo que las tareas se crean con IDs 1, 2, 3, 4 (o podemos buscarlas por nombre y asignarlas)
-- Tarea 1: 'Configurar sistema' (admin) -> Trabajo, Urgente
INSERT IGNORE INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Configurar sistema' AND c.title IN ('Trabajo', 'Urgente');

-- Tarea 2: 'Aprobar usuarios' (admin) -> Trabajo
INSERT IGNORE INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Aprobar usuarios' AND c.title IN ('Trabajo');

-- Tarea 3: 'Completar perfil' (user) -> Personal
INSERT IGNORE INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Completar perfil' AND c.title IN ('Personal');

-- Tarea 4: 'Revisar dashboard' (gestor) -> Proyectos
INSERT IGNORE INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Revisar dashboard' AND c.title IN ('Proyectos');
