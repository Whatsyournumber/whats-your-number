-- Elimina el holding de deuda 'Ph Riverside' (160k) que duplica la hipoteca ya ligada a la propiedad.
DELETE FROM holdings WHERE id = '6c716e12-f24b-428e-9e97-4d5e65ad7039';
-- Limpia filas vacías (manual_value 0) del otro usuario.
DELETE FROM holdings WHERE id IN ('de1e058f-29a5-4913-aba5-6ac0d2619e3f','44d67baa-01b5-4015-a8c1-412abbcd0330');
-- Sincroniza el perfil: el único pasivo ahora es la hipoteca de 160k.
UPDATE onboarding_profiles SET liabilities = 160000 WHERE user_id = '5a519cb4-e840-4c3a-bbad-e03f9c911383';