# Método 2: Buscar el span que contiene "Pág" y obtener el span siguiente con el número
        # label_span = soup.find(
        #     "span", class_="label", string=re.compile(r"Pág", re.IGNORECASE)
        # )
        # if label_span:
        #     next_span = label_span.find_next_sibling("span")
        #     if next_span and next_span.get_text(strip=True).isdigit():
        #         total_pages = int(next_span.get_text(strip=True))
        #         print(
        #             f"✅ Total de páginas encontrado en span siguiente a 'Pág': {total_pages}"
        #         )
        #         return total_pages

        # # Método 3: Buscar dentro del contenedor de paginación con diferentes selectores
        # pagination_selectors = [
        #     "a.page.last",
        #     ".pages .page.last",
        #     ".pages-item-last a",
        #     ".pagination .page.last",
        #     'a[href*="p="]',
        # ]

        # for selector in pagination_selectors:
        #     last_page_elem = soup.select_one(selector)
        #     if last_page_elem:
        #         href = last_page_elem.get("href", "")
        #         text = last_page_elem.get_text(strip=True)

        #         # Extraer de la URL (ej: ?p=36)
        #         if href:
        #             page_match = re.search(r"[?&]p=(\d+)", href)
        #             if page_match:
        #                 total_pages = int(page_match.group(1))
        #                 print(
        #                     f"✅ Total de páginas encontrado en URL con selector '{selector}': {total_pages}"
        #                 )
        #                 return total_pages

        #         # Extraer del texto
        #         if text.isdigit():
        #             total_pages = int(text)
        #             print(
        #                 f"✅ Total de páginas encontrado en texto con selector '{selector}': {total_pages}"
        #             )
        #             return total_pages

        # # Método 4: Buscar cualquier enlace que contenga el parámetro más alto de página
        # page_links = soup.find_all("a", href=re.compile(r"[?&]p=\d+"))
        # if page_links:
        #     max_page = 0
        #     for link in page_links:
        #         href = link.get("href", "")
        #         page_match = re.search(r"[?&]p=(\d+)", href)
        #         if page_match:
        #             page_num = int(page_match.group(1))
        #             max_page = max(max_page, page_num)

        #     if max_page > 0:
        #         print(
        #             f"✅ Total de páginas encontrado buscando el máximo en enlaces: {max_page}"
        #         )
        #         return max_page

        # print("⚠️ No se pudo determinar el número de páginas, usando 1")
        # return 1