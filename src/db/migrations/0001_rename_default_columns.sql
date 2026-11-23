-- Default column names without accents (existing databases keep custom names untouched).
UPDATE `columns` SET `name` = 'A postuler' WHERE `name` = 'À postuler';--> statement-breakpoint
UPDATE `columns` SET `name` = 'Deja postule' WHERE `name` = 'Déjà postulé';--> statement-breakpoint
UPDATE `columns` SET `name` = 'Refuse' WHERE `name` = 'Refusé';--> statement-breakpoint
UPDATE `columns` SET `name` = 'Archive' WHERE `name` = 'Archivé';
