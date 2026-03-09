-- Limpa os esportes antigos (ligas específicas)
DELETE FROM sports;

-- Insere os grupos genéricos de esportes.
-- O campo 'key' deve corresponder exatamente ao 'group' retornado pela Odds API (em minúsculas)
INSERT INTO sports (key, title, active) VALUES
('soccer', 'Futebol', true),
('basketball', 'Basquete', true),
('tennis', 'Tênis', true),
('american football', 'Futebol Americano', false),
('ice hockey', 'Hóquei no Gelo', false),
('mixed martial arts', 'MMA', false),
('volleyball', 'Vôlei', false),
('baseball', 'Beisebol', false);
