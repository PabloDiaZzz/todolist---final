-- data.sql

-- Insertar Usuarios si no existen
INSERT INTO usuario (full_name, username, email, password, role, theme)
SELECT data.full_name, data.username, data.email, data.password, data.role, data.theme FROM (
    SELECT 'Andrés Admin' as full_name, 'admin' as username, 'admin@example.com' as email, '$2a$10$DdtJkm5Xnuj04oE2WRRpAOmyFZWHZSJy994RXwF.sSeDO99NGK5mO' as password, 'ROLE_ADMIN' as role, 'SYSTEM' as theme UNION ALL
    SELECT 'Juan Pérez', 'user', 'user@example.com', '$2a$10$Yd6SxDErzdMhpB4uDIrah.ywCtCrvZcD82Omclpec1qiixMiZ8kE.', 'ROLE_USER', 'SYSTEM' UNION ALL
    SELECT 'Carlos Gestor', 'gestor', 'gestor@example.com', '$2a$10$409L8JBDzl1JcmuY6hIS.u1f0JUisCbjUb/Gg8HwUpc.zSfvhKyMu', 'ROLE_MANAGER', 'SYSTEM'
) data
WHERE NOT EXISTS (SELECT 1 FROM usuario u WHERE u.username = data.username);

-- Insertar Tareas (Originales y Nuevas)
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

INSERT INTO task (created_at, last_edit, title, description, completed, important, author_id)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Revisar logs del servidor', 'Revisar los logs de producción en Render para detectar errores', false, true, (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM task t WHERE t.title = 'Revisar logs del servidor');

INSERT INTO task (created_at, last_edit, title, description, completed, important, author_id)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Actualizar dependencias', 'Subir la versión de Spring Boot y Node.js', false, false, (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM task t WHERE t.title = 'Actualizar dependencias');

INSERT INTO task (created_at, last_edit, title, description, completed, important, author_id)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Comprar la compra semanal', 'Ir al supermercado a por verdura, carne y lácteos', false, true, (SELECT id FROM usuario WHERE username = 'user')
WHERE NOT EXISTS (SELECT 1 FROM task t WHERE t.title = 'Comprar la compra semanal');

INSERT INTO task (created_at, last_edit, title, description, completed, important, author_id)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Llamar al médico', 'Pedir cita para la revisión anual', false, false, (SELECT id FROM usuario WHERE username = 'user')
WHERE NOT EXISTS (SELECT 1 FROM task t WHERE t.title = 'Llamar al médico');

INSERT INTO task (created_at, last_edit, title, description, completed, important, author_id)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Estudiar para el examen de FOL', 'Repasar los apuntes de prevención de riesgos y contratos', false, true, (SELECT id FROM usuario WHERE username = 'user')
WHERE NOT EXISTS (SELECT 1 FROM task t WHERE t.title = 'Estudiar para el examen de FOL');

INSERT INTO task (created_at, last_edit, title, description, completed, important, author_id)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Preparar informe de métricas', 'Extraer datos del mes y montar presentación para la reunión', false, true, (SELECT id FROM usuario WHERE username = 'gestor')
WHERE NOT EXISTS (SELECT 1 FROM task t WHERE t.title = 'Preparar informe de métricas');

INSERT INTO task (created_at, last_edit, title, description, completed, important, author_id)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Revisar presupuestos', 'Aprobar las facturas pendientes del trimestre', false, false, (SELECT id FROM usuario WHERE username = 'gestor')
WHERE NOT EXISTS (SELECT 1 FROM task t WHERE t.title = 'Revisar presupuestos');

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

-- Insertar Etiquetas (Tags)
INSERT INTO tag (name)
SELECT data.name FROM (
    SELECT 'backend' as name UNION ALL
    SELECT 'frontend' UNION ALL
    SELECT 'devops' UNION ALL
    SELECT 'rutina' UNION ALL
    SELECT 'compras' UNION ALL
    SELECT 'revisión' UNION ALL
    SELECT 'documentación'
) data
WHERE NOT EXISTS (SELECT 1 FROM tag t WHERE t.name = data.name);

-- Vincular Categorías a Tareas
INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Configurar sistema' AND c.title IN ('Trabajo', 'Urgente')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);

INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Aprobar usuarios' AND c.title IN ('Trabajo')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);

INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Completar perfil' AND c.title IN ('Personal')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);

INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Revisar dashboard' AND c.title IN ('Proyectos')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);

INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Revisar logs del servidor' AND c.title IN ('Trabajo', 'Urgente')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);

INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Actualizar dependencias' AND c.title IN ('Proyectos')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);

INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Comprar la compra semanal' AND c.title IN ('Hogar')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);

INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Llamar al médico' AND c.title IN ('Salud')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);

INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Estudiar para el examen de FOL' AND c.title IN ('Estudios', 'Urgente')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);

INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Preparar informe de métricas' AND c.title IN ('Trabajo', 'Finanzas')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);

INSERT INTO tarea_cats (tarea_id, cat_id)
SELECT t.id, c.id FROM task t, category c 
WHERE t.title = 'Revisar presupuestos' AND c.title IN ('Finanzas')
AND NOT EXISTS (SELECT 1 FROM tarea_cats tc WHERE tc.tarea_id = t.id AND tc.cat_id = c.id);

-- Vincular Etiquetas (Tags) a Tareas
INSERT INTO tarea_tags (tarea_id, tag_id)
SELECT t.id, tg.id FROM task t, tag tg 
WHERE t.title = 'Revisar logs del servidor' AND tg.name IN ('backend', 'devops')
AND NOT EXISTS (SELECT 1 FROM tarea_tags tt WHERE tt.tarea_id = t.id AND tt.tag_id = tg.id);

INSERT INTO tarea_tags (tarea_id, tag_id)
SELECT t.id, tg.id FROM task t, tag tg 
WHERE t.title = 'Actualizar dependencias' AND tg.name IN ('backend', 'frontend')
AND NOT EXISTS (SELECT 1 FROM tarea_tags tt WHERE tt.tarea_id = t.id AND tt.tag_id = tg.id);

INSERT INTO tarea_tags (tarea_id, tag_id)
SELECT t.id, tg.id FROM task t, tag tg 
WHERE t.title = 'Comprar la compra semanal' AND tg.name IN ('rutina', 'compras')
AND NOT EXISTS (SELECT 1 FROM tarea_tags tt WHERE tt.tarea_id = t.id AND tt.tag_id = tg.id);

INSERT INTO tarea_tags (tarea_id, tag_id)
SELECT t.id, tg.id FROM task t, tag tg 
WHERE t.title = 'Preparar informe de métricas' AND tg.name IN ('documentación', 'revisión')
AND NOT EXISTS (SELECT 1 FROM tarea_tags tt WHERE tt.tarea_id = t.id AND tt.tag_id = tg.id);