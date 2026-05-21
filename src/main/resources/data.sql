-- data.sql

-- Insertar Usuarios si no existen (contraseñas son: <Usuario>.123 generadas con BCrypt)
INSERT INTO usuario (full_name, username, email, password, role, theme)
SELECT data.full_name, data.username, data.email, data.password, data.role, data.theme FROM (
    SELECT 'Andrés Admin' as full_name, 'admin' as username, 'admin@example.com' as email, '$2a$10$DdtJkm5Xnuj04oE2WRRpAOmyFZWHZSJy994RXwF.sSeDO99NGK5mO' as password, 'ROLE_ADMIN' as role, 'SYSTEM' as theme UNION ALL
    SELECT 'Juan Pérez', 'user', 'user@example.com', '$2a$10$Yd6SxDErzdMhpB4uDIrah.ywCtCrvZcD82Omclpec1qiixMiZ8kE.', 'ROLE_USER', 'SYSTEM' UNION ALL
    SELECT 'Carlos Gestor', 'gestor', 'gestor@example.com', '$2a$10$409L8JBDzl1JcmuY6hIS.u1f0JUisCbjUb/Gg8HwUpc.zSfvhKyMu', 'ROLE_MANAGER', 'SYSTEM'
) data
WHERE NOT EXISTS (SELECT 1 FROM usuario u WHERE u.username = data.username);

-- Insertar Tareas de ejemplo para cada usuario solo si no existen previamente
INSERT INTO task (created_at, last_edit, title, description, completed, important, author_id)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Configurar sistema', 'Revisar la configuración inicial del sistema', false, false, id FROM usuario WHERE username = 'admin'
AND NOT EXISTS (SELECT 1 FROM task WHERE title = 'Configurar sistema' AND author_id IN (SELECT id FROM usuario WHERE username = 'admin')) LIMIT 1;

INSERT INTO task (created_at, last_edit, title, description, completed, important, author_id)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Aprobar usuarios', 'Revisar la lista de nuevos registros y aprobar accesos', true, false, id FROM usuario WHERE username = 'admin'
AND NOT EXISTS (SELECT 1 FROM task WHERE title = 'Aprobar usuarios' AND author_id IN (SELECT id FROM usuario WHERE username = 'admin')) LIMIT 1;

INSERT INTO task (created_at, last_edit, title, description, completed, important, author_id)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Completar perfil', 'Añadir foto y actualizar datos personales', false, false, id FROM usuario WHERE username = 'user'
AND NOT EXISTS (SELECT 1 FROM task WHERE title = 'Completar perfil' AND author_id IN (SELECT id FROM usuario WHERE username = 'user')) LIMIT 1;

INSERT INTO task (created_at, last_edit, title, description, completed, important, author_id)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Revisar dashboard', 'Verificar que las estadísticas se muestran correctamente', false, false, id FROM usuario WHERE username = 'gestor'
AND NOT EXISTS (SELECT 1 FROM task WHERE title = 'Revisar dashboard' AND author_id IN (SELECT id FROM usuario WHERE username = 'gestor')) LIMIT 1;

-- Insertar Categorías
INSERT INTO category (title)
SELECT data.title FROM (
    SELECT 'Trabajo' as title UNION ALL
    SELECT 'Personal' UNION ALL
    SELECT 'Urgente' UNION ALL
    SELECT 'Ocio' UNION ALL
    SELECT 'Salud' UNION ALL
    SELECT 'Hogar' UNION ALL
    SELECT 'Estudios' UNION ALL
    SELECT 'Finanzas' UNION ALL
    SELECT 'Proyectos' UNION ALL
    SELECT 'Ideas'
) data
WHERE NOT EXISTS (SELECT 1 FROM category c WHERE c.title = data.title);

-- Vincular Categorías a Tareas solo si no existe ya la relación
-- Tarea 1: 'Configurar sistema' (admin) -> Trabajo, Urgente
INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Configurar sistema' AND c.title IN ('Trabajo', 'Urgente')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);

-- Tarea 2: 'Aprobar usuarios' (admin) -> Trabajo
INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Aprobar usuarios' AND c.title IN ('Trabajo')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);

-- Tarea 3: 'Completar perfil' (user) -> Personal
INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Completar perfil' AND c.title IN ('Personal')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);

-- Tarea 4: 'Revisar dashboard' (gestor) -> Proyectos
INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Revisar dashboard' AND c.title IN ('Proyectos')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);