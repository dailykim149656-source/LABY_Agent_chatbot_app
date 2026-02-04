-- MSDS_Table chem_name_ko 인덱스 확인 및 생성
-- 1) chem_name_ko 인덱스 확인
SELECT i.name AS index_name
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.MSDS_Table')
  AND i.name = N'IX_MSDS_Table_chem_name_ko';

-- 2) chem_name_ko 인덱스 생성 (없을 때만)
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes AS i
    WHERE i.object_id = OBJECT_ID(N'dbo.MSDS_Table')
      AND i.name = N'IX_MSDS_Table_chem_name_ko'
)
BEGIN
    CREATE INDEX IX_MSDS_Table_chem_name_ko
        ON dbo.MSDS_Table (chem_name_ko);
END;

-- 3) 공백 제거 정규화 컬럼 추가 (없을 때만, PERSISTED로 인덱스 가능)
IF COL_LENGTH('dbo.MSDS_Table', 'chem_name_ko_nospace') IS NULL
BEGIN
    ALTER TABLE dbo.MSDS_Table
        ADD chem_name_ko_nospace AS REPLACE(chem_name_ko, ' ', '') PERSISTED;
END;

-- 4) 정규화 컬럼 인덱스 생성 (없을 때만)
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes AS i
    WHERE i.object_id = OBJECT_ID(N'dbo.MSDS_Table')
      AND i.name = N'IX_MSDS_Table_chem_name_ko_nospace'
)
BEGIN
    CREATE INDEX IX_MSDS_Table_chem_name_ko_nospace
        ON dbo.MSDS_Table (chem_name_ko_nospace);
END;
