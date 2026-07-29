"""
Tests for the specs -> characteristics_* column mapping in racket_manager.

`discover` extracts specs into JSON (`Forma`, `Balance`, `Núcleo`...) but
until this mapping existed, none of it ever reached the `characteristics_*`
columns that `search_document` (a generated column) and the UI filters
actually read from — so palas found by discover were unsearchable.
"""

from src.scrapers.racket_manager import RacketManager


def _manager() -> RacketManager:
    return RacketManager(client=None, rows=[])


class TestSpecsToCharacteristics:
    def test_maps_known_spanish_keys_to_characteristics_columns(self):
        entry = {
            "model": "Test Racket", "brand": "TestBrand", "description": "",
            "specs": {"Forma": "Diamante", "Balance": "Alto", "Núcleo": "Foam"},
            "images": [], "prices": [],
        }
        row = _manager()._entry_to_row("test-slug", entry)

        assert row["characteristics_shape"] == "Diamante"
        assert row["characteristics_balance"] == "Alto"
        assert row["characteristics_core"] == "Foam"

    def test_key_matching_is_accent_and_case_insensitive(self):
        # DB has both "Tipo de Juego" and "Tipo de juego" in the wild.
        entry = {
            "model": "Test Racket", "brand": "TestBrand", "description": "",
            "specs": {"Tipo de juego": "Polivalente"},
            "images": [], "prices": [],
        }
        row = _manager()._entry_to_row("test-slug", entry)

        assert row["characteristics_game_type"] == "Polivalente"

    def test_unmapped_keys_are_left_out_of_the_row(self):
        # Peso/Año/Modelo/etc. have no characteristics_* column — they must
        # stay only inside the `specs` jsonb blob, not spill into the row.
        entry = {
            "model": "Test Racket", "brand": "TestBrand", "description": "",
            "specs": {"Peso": "365 g", "Año": "2026"},
            "images": [], "prices": [],
        }
        row = _manager()._entry_to_row("test-slug", entry)

        assert "characteristics_peso" not in row
        assert "characteristics_ano" not in row

    def test_rugosidad_maps_to_surface(self):
        # PadelNuestro's attribute table confirms this: its "Superficie"
        # label uses the exact same value vocabulary (Gomosa/Lisa/Rugosa/
        # Arenosa) as the Magento padelracket_surface attribute, and
        # normalize_specs already canonicalizes "Superficie" -> "Rugosidad"
        # (see base_scraper.SPEC_NAME_MAP) — so by the time specs reach
        # this mapping, "Rugosidad" IS the surface-texture key.
        entry = {
            "model": "Test Racket", "brand": "TestBrand", "description": "",
            "specs": {"Rugosidad": "Rugosa"},
            "images": [], "prices": [],
        }
        row = _manager()._entry_to_row("test-slug", entry)

        assert row["characteristics_surface"] == "Rugosa"

    def test_formato_and_acabado_map_to_their_own_columns_not_forma_or_surface(self):
        # Regression: base_scraper.SPEC_NAME_MAP used to collapse Formato
        # into Forma and Acabado into Rugosidad, which silently overwrote
        # the real shape with the package format once both keys appeared
        # in the same specs dict (as PadelNuestro's attribute table does).
        entry = {
            "model": "Test Racket", "brand": "TestBrand", "description": "",
            "specs": {"Forma": "Redonda", "Formato": "Normal", "Acabado": "Mate", "Rugosidad": "Arenosa"},
            "images": [], "prices": [],
        }
        row = _manager()._entry_to_row("test-slug", entry)

        assert row["characteristics_shape"] == "Redonda"
        assert row["characteristics_format"] == "Normal"
        assert row["characteristics_finish"] == "Mate"
        assert row["characteristics_surface"] == "Arenosa"

    def test_empty_or_missing_value_does_not_write_the_column(self):
        # Never overwrite a good stored value with something derived from an
        # empty spec — only write when there's an actual value to write.
        entry = {
            "model": "Test Racket", "brand": "TestBrand", "description": "",
            "specs": {"Forma": ""},
            "images": [], "prices": [],
        }
        row = _manager()._entry_to_row("test-slug", entry)

        assert "characteristics_shape" not in row
