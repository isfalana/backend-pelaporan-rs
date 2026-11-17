'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {

        await queryInterface.createTable('evidence', {

            id_evidence: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },

            id_laporan: {
                type: Sequelize.STRING(50),
                allowNull: true,
                references: {
                    model: 'laporan',
                    key: 'id_laporan'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },

            id_detail: {
                type: Sequelize.STRING(50),
                allowNull: true,
                references: {
                    model: 'detail_tindakan',
                    key: 'id_detail'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },

            original_name: {
                type: Sequelize.TEXT,
                allowNull: false
            },

            stored_name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true
            },

            file_path: {
                type: Sequelize.TEXT,
                allowNull: false
            },

            mime_type: {
                type: Sequelize.STRING(100),
                allowNull: false
            },

            file_size: {
                type: Sequelize.BIGINT,
                allowNull: false
            },

            uploaded_by: {
                type: Sequelize.STRING(50),
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id_nik'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },

            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },

            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },

            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true
            }

        });

        // Setiap evidence wajib memiliki tepat satu relasi.
        await queryInterface.sequelize.query(`
            ALTER TABLE evidence
            ADD CONSTRAINT chk_evidence_target
            CHECK (
                (id_laporan IS NOT NULL AND id_detail IS NULL)
                OR
                (id_laporan IS NULL AND id_detail IS NOT NULL)
            );
        `);

        // Index untuk mempercepat pencarian dokumen.
        await queryInterface.addIndex(
            'evidence',
            ['id_laporan'],
            { name: 'idx_evidence_laporan' }
        );

        await queryInterface.addIndex(
            'evidence',
            ['id_detail'],
            { name: 'idx_evidence_detail' }
        );

        await queryInterface.addIndex(
            'evidence',
            ['uploaded_by'],
            { name: 'idx_evidence_uploaded_by' }
        );

    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('evidence');
    }
};