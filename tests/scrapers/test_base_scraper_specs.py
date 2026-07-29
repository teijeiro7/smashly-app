"""
Tests for normalize_specs' key collapsing (SPEC_NAME_MAP).

Regression coverage: 'Formato'/'Acabado' used to collapse into 'Forma'/
'Rugosidad' respectively. That was invisible while no scraper produced both
keys in the same specs dict — PadelNuestro's attribute-table parser now
does, and the collision silently overwrote real shape/finish data.
"""

from src.scrapers.base_scraper import normalize_specs


class TestNormalizeSpecsKeyCollisions:
    def test_formato_does_not_collide_with_forma(self):
        specs = normalize_specs({"Forma": "Redonda", "Formato": "Normal"})

        assert specs["Forma"] == "Redonda"
        assert specs["Formato"] == "Normal"

    def test_acabado_does_not_collide_with_rugosidad(self):
        specs = normalize_specs({"Acabado": "Mate", "Rugosidad": "Arenosa"})

        assert specs["Acabado"] == "Mate"
        assert specs["Rugosidad"] == "Arenosa"

    def test_superficie_still_collapses_into_rugosidad(self):
        # Confirmed intentional: PadelNuestro's "Superficie" label shares
        # the exact Gomosa/Lisa/Rugosa/Arenosa vocabulary of the Magento
        # padelracket_surface attribute — same concept, different label.
        specs = normalize_specs({"Superficie": "Arenosa"})

        assert specs["Rugosidad"] == "Arenosa"

    def test_superficie_with_accented_i_also_collapses(self):
        # PadelNuestro's own site renders the label as "Superfície" (with
        # an accented í) rather than "Superficie" — both must normalize
        # the same way.
        specs = normalize_specs({"Superfície": "Rugosa"})

        assert specs["Rugosidad"] == "Rugosa"

    def test_marca_is_always_dropped(self):
        specs = normalize_specs({"Marca": "Siux", "Forma": "Diamante"})

        assert "Marca" not in specs
        assert specs["Forma"] == "Diamante"
