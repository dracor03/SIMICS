/*
  © 2021 Intel Corporation

  This software and the related documents are Intel copyrighted materials, and
  your use of them is governed by the express license under which they were
  provided to you ("License"). Unless the License provides otherwise, you may
  not use, modify, copy, publish, distribute, disclose or transmit this software
  or the related documents without Intel's prior written permission.

  This software and the related documents are provided as is, with no express or
  implied warranties, other than those that are expressly stated in the License.
*/

function get_master_toc_controller(base, URL, createElement, pushState, toc_pane) {
    const toc_elements = {};
    const href_sections = {}; // maps from href to section href
    const toc_titles = {};
    let navigation_target = null;

    var hrefs;

    return {
        toc_loaded: toc_loaded,
        hrefs_loaded: hrefs_loaded,
        navigate_to: navigate_to
    }

    function toc_loaded(master_toc) {
        index_titles(master_toc);
        build_toc(master_toc);
        try_index_hrefs();
        try_to_navigate_to_saved_target();

        function index_titles(c) {
            toc_titles[new URL(c.href, base)] = c.name;
            c.children.forEach(index_titles);
        }

        function build_toc(master_toc) {
            toc_pane.innerHTML = "";
            toc_pane.appendChild(top_level_ul(master_toc));

            function top_level_ul(c) {
                let ul = createElement("ul");
                c.children.forEach(c => {
                    if (c.href === null) {
                        let li = createElement("li");
                        let title = createElement("span");
                        title.innerText = c.name;
                        li.appendChild(title);
                        li.classList.add("doc-category");
                        ul.appendChild(li);
                        c.children.forEach(c => {
                            ul.appendChild(top_level_li(c));
                        });
                    } else {
                        ul.appendChild(top_level_li(c));
                    }
                })
                return ul;
            }

            function section_ul(c) {
                let ul = toc_ul(c, section_li);
                return ul;
            }

            function toc_ul(c, li_builder) {
                let ul = createElement("ul");
                c.children.forEach(c => {
                    ul.appendChild(li_builder(c));
                })
                return ul;
            }

            function top_level_li(c) {
                let li = toc_li(c, c.href == null ? top_level_ul : section_ul, c.href != null);
                if (c.href == null) {
                    li.classList.add("doc-category");
                } else {
                    li.classList.add("top-level");
                }
                return li;
            }

            function section_li(c) {
                let li = toc_li(c, section_ul, !c.same_page_as_parent);
                if (c.same_page_as_parent) {
                    li.classList.add("same-page-as-parent");
                }
                return li;
            }

            function toc_li(c, ul_builder, foldable) {
                let li = createElement("li");
                let url = add_toc_element(c.href, li);
                let title = c.href !== null ? document_link_element()
                    : createElement("span");
                title.innerText = c.name;
                if (c.children.length != 0 && foldable) {
                    li.appendChild(fold_button());
                }
                li.appendChild(title);
                if (c.children.length != 0) {
                    li.appendChild(ul_builder(c));
                }
                return li;

                function document_link_element() {
                    let a = createElement("a");
                    a.setAttribute("href", url.href);
                    a.setAttribute("target", "main-contents");
                    return a;
                }

                function fold_button() {
                    let button = createElement("button");
                    button.type = "button";
                    button.classList.add("fold");
                    button.addEventListener('click', function (event) {
                        let parent = event.target.parentElement;
                        if (parent.classList.contains("closed")) {
                            parent.classList.remove("closed");
                            parent.classList.add("opened");
                        } else if (parent.classList.contains("on-path")) {
                            parent.classList.add("closed");
                            parent.classList.remove("opened");
                        } else {
                            event.target.parentElement.classList.toggle("opened");
                        }
                        console.log("Fold button clicked");
                    });
                    return button;
                }
            }

            function add_toc_element(href, li) {
                let url = new URL(href, base);
                toc_elements[url] = li;
                return url;
            }
        }
    }

    function hrefs_loaded(hrefs_list) {
        hrefs = hrefs_list;
        try_index_hrefs();
        try_to_navigate_to_saved_target();
    }

    function navigate_to(content_url) {
        let url = new URL(content_url || base, base);
        navigate_to_url(url);
    }

    function navigate_to_url(url) {
        if (Object.keys(toc_elements).length == 0) {
            // the toc isn't loaded, retry once it is loaded
            navigation_target = url;
            return;
        }

        let section_url = select(url);
        let title = lookup_title(section_url);
        pushState({}, title, url);

        function select(url) {
            if (Object.keys(href_sections).length == 0) {
                // the href_sections aren't loaded, try with the url directly
                let target = toc_elements[url];
                if (target === undefined) {
                    // the url does not point at a toc element
                    // retry once the href_sections are loaded
                    navigation_target = url;
                    // fall back to the page until then
                    select_page(url);
                } else {
                    // the url points directly at a toc element. SUCCESS
                    select_target(target);
                }
            } else {
                let section_url = href_sections[url];
                if (section_url === undefined) {
                    // if there is no section_url our list of hrefs is incomplete,
                    // or the user is following a broken or old url.
                    // fall back to the page instead
                    select_page(url);
                } else {
                    // target will always be found, as all values in href_sections
                    // are toc_element keys
                    let target = toc_elements[section_url];
                    select_target(target);
                    return section_url;
                }
            }
            return url;
        }

        function select_page(url) {
            let page_target = toc_elements[page_url(url)];
            if (page_target !== undefined) {
                // select the page
                select_target(page_target);
            } else {
                // if not even the page is part of the toc, we have a really
                // old or broken link.
                clear_selection();
            }
        }

        function select_target(target) {
            clear_selection();
            target.classList.add("current");
            let element = target;
            while (element != toc_pane) {
                element.classList.remove("closed");
                element.classList.add("on-path");
                element = element.parentElement;
            }
            target.firstElementChild.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }

        function clear_selection() {
            toc_pane.querySelectorAll(".on-path").forEach(t => {
                t.classList.remove("closed");
                t.classList.remove("on-path");
                t.classList.remove("current");
            });
        }

        function lookup_title(url) {
            if (!url) {
                return "Intel® Simics® Simulator 7 Documentation";
            }
            return toc_titles[url] || toc_titles[page_url(url)] || "Intel® Simics® Simulator 7 Documentation";
        }

        function page_url(url) {
            let pu = new URL(url);
            pu.hash = "";
            return pu;
        }
    }

    function try_to_navigate_to_saved_target() {
        if (navigation_target !== null && href_sections.hasOwnProperty(navigation_target)) {
            // If someone requested to navigate to an element in the toc
            // before the all data was loaded we need to honor that request now
            // that the data is actually loaded
            navigate_to_url(href_sections[navigation_target]);
            navigation_target = null;
        }
    }

    function try_index_hrefs() {
        if (hrefs === undefined || Object.keys(toc_elements).length == 0) {
            return;
        }
        var current_section = null;
        hrefs.forEach(h => {
            let url = new URL(h, base);
            if (toc_elements.hasOwnProperty(url)) {
                current_section = url;
            }
            href_sections[url] = current_section;
        })
    }
}

function get_search_controller(
    base_uri,
    createElement,
    search_input,
    search_pane,
    search_output,
    toggle_results_button,
    match_case_toggle,
    whole_words_toggle,
    local_search_toggle,
    local_search_label,
    local_search_div,
    get_current_page
) {
    const MAX_SNIPPET_PREFIX = 30;
    const MAX_SNIPPET_SUFFIX = 100;
    const MAX_RESULTS_AT_A_TIME = 100;

    search_output.innerHTML = "<i>Loading index...</i>";

    let index;
    let documents = {};
    let timeout = 0;
    let previous_query = undefined;
    let previous_match_case = undefined;
    let previous_scope = undefined;
    let previous_whole_words = undefined;

    // Add keyup to also get results while typing, and not only on enter
    search_input.addEventListener('keyup', function (event) {
        event.preventDefault();
        if (event.key === "Escape") {
            // This will be handled by the search callback
            return;
        }
        delay(do_search, 200);
    });

    search_input.addEventListener('search', function (event) {
        event.preventDefault();
        if (search_input.value === '') {
            hide_search_results();
        } else {
            do_search();
        }
    });

    search_input.addEventListener('blur', function () {
        if (search_input.value === '') {
            hide_search_results();
        }
    });

    search_input.addEventListener('focus', function () {
        if (search_input.value !== '') {
            show_search_results();
        }
    });

    local_search_toggle.addEventListener('change', function () {
        refresh_search_results();
    })
    match_case_toggle.addEventListener('change', function () {
        refresh_search_results();
    })
    whole_words_toggle.addEventListener('change', function () {
        refresh_search_results();
    });

    toggle_results_button.addEventListener('click', function (event) {
        event.preventDefault();
        toggle_search_results();
    });

    return {
        index_loaded: function (search_index) {
            index = search_index;

            for (doc of index.documents) {
                documents[doc.id] = doc;
            }

            search_output.innerHTML = "";
            refresh_local_label();
            try_do_delayed_search();
        },
        page_changed: function () {
            if (local_search_toggle.checked) {
                refresh_search_results();
            }
            refresh_local_label();
        }
    };

    function delay(f, ms) {
        clearTimeout(timeout);
        timeout = setTimeout(f, ms || 0);
    }

    function refresh_local_label() {
        let current = current_document();
        let label = "Only search in current document";
        if (current) {
            local_search_toggle.disabled = false;
            local_search_div.classList.remove("hidden");
            let title = documents[current].title;
            if (title !== undefined) {
                label = "Only search in <i>" + title + "</i>";
            }
        } else {
            local_search_div.classList.add("hidden");
            local_search_toggle.disabled = true;
        }
        local_search_label.innerHTML = label;
    }


    function try_do_delayed_search() {
        if (index !== undefined) {
            console.log("Index loaded, enabling search");
            if (is_search_output_visible()) {
                do_search();
            }
        }
    }

    function do_search() {
        refresh_search_results();
        show_search_results();
    }

    function refresh_search_results() {
        if (index !== undefined) {
            const query = search_input.value;
            const scope = local_search_toggle.checked
                ? current_document() : null;
            const match_case = match_case_toggle.checked;
            const whole_words = whole_words_toggle.checked;

            if (query === previous_query && scope === previous_scope
                && match_case === previous_match_case
                && whole_words === previous_whole_words
            ) {
                return;
            }
            previous_query = query;
            previous_scope = scope;
            previous_match_case = match_case;
            previous_whole_words = whole_words;

            build_search_results(query, match_case, whole_words, scope);
        }

        function build_search_results(query, match_case, whole_words, scope) {
            const query_re = build_re(query, match_case, whole_words);
            let results = get_search_results();
            if (results.length === 0) {
                search_output.innerHTML = "<i>No results.</i>";
            } else {
                search_output.textContent = '';
                add_results(search_output);
            }
            function add_results(container) {
                // Here we basically iterate over all the search results and
                // build DOM-elements representing them. However, we only add
                // at most max_count results at a time.
                // If we add more we overwhelm the browser and cause jank.
                // The continuation function outputs max_count results each
                // time it is called and a button to add more results if needed.
                // When the button is pressed, continuation is called again.
                // It picks up where it left off. It needs to know at which
                // document and page element it was inserting DOM elements and
                // at which document, page and section in the search results
                // it left off. These variables captures this state.
                let doc_element = null;
                let page_element = null;
                let di = 0;
                let pi = 0;
                let si = 0;
                continuation();

                function continuation() {
                    let count = 0;
                    for (; di < results.documents.length; di++) {
                        const doc = results.documents[di];
                        if (!doc_element) {
                            doc_element = create_details(container, doc.title);
                        }
                        for (; pi < doc.pages.length; pi++) {
                            const page = doc.pages[pi];
                            if (!page_element) {
                                page_element = create_details(doc_element,
                                    page.title);
                            }
                            for (; si < page.sections.length; si++) {
                                count += 1;
                                if (count > MAX_RESULTS_AT_A_TIME) {
                                    add_load_more_button();
                                    return;
                                }
                                const section = page.sections[si];
                                add_section(page_element, doc, section);
                            }
                            si = 0;
                            page_element = null;
                        }
                        pi = 0;
                        doc_element = null;
                    }
                }
                function add_load_more_button() {
                    const load_more = element(container, "div");
                    load_more.classList.add("load-more");
                    const load_more_button = element(load_more, "button");
                    load_more_button.type = "button";
                    load_more_button.textContent = "Load more";
                    load_more_button.addEventListener('click', function () {
                        load_more.remove();
                        continuation();
                    });
                }
            }
            function get_search_results() {
                if (query.length === 0) {
                    return { documents: [], length: 0 };
                }
                let documents = [];
                let length = 0;
                for (doc of index.documents) {
                    if (scope && scope !== doc.id) {
                        continue;
                    }
                    let pages = [];
                    for (page of doc.pages) {
                        let sections = [];
                        for (section of page.sections) {
                            if (section.text.search(query_re) === -1) {
                                continue;
                            }
                            sections.push(section);
                            length += 1;
                        }
                        if (sections.length !== 0) {
                            pages.push({
                                title: page.title, sections: sections
                            });
                        }
                    }
                    if (pages.length !== 0) {
                        documents.push({
                            title: doc.title, id: doc.id, pages: pages
                        });
                    }
                }
                return { documents: documents, length: length };
            }
            function add_section(parent, doc, section) {
                const section_li = element(parent, "li");
                section_li.classList.add("section")
                const section_a = element(section_li, "a");
                const href = doc.id + "/" + section.url;
                section_a.setAttribute("href", href);
                section_a.setAttribute("target", "main-contents");
                section_a.addEventListener("click", function () {
                    hide_search_results();
                })
                const section_title = element(section_a, "div");
                section_title.classList.add("title");
                section_title.textContent = section.title;
                const snippet = element(section_a, "div");
                snippet.classList.add("snippet");
                build_snippet(snippet, section.text);
            }
            function build_snippet(parent, text) {
                // Find the range of the snippet
                const first_hit = text.search(query_re);
                const start = Math.max(
                    nth_last(4, text, " ", first_hit) + 1,
                    0,
                    first_hit - MAX_SNIPPET_PREFIX);
                const end = Math.min(
                    first_hit + query.length + MAX_SNIPPET_SUFFIX,
                    text.length);

                // Build the snippet from context and marked hits
                let i = start;
                while (i < end) {
                    const tail = text.slice(i);
                    const hit = tail.search(query_re);
                    if (hit === -1 || (hit + i) >= end) {
                        break;
                    }
                    parent.append(tail.slice(0, hit));
                    const mark = element(parent, "mark");
                    const hit_start = i + hit;
                    const hit_end = Math.min(end, hit_start + query.length);
                    mark.textContent = text.slice(hit_start, hit_end);
                    i = hit_end;
                }
                parent.append(text.slice(i, end));
                if (end !== text.length) {
                    parent.append("…");
                }
            }
        }
    }

    // This function is enough for us. By escaping all syntax characters the
    // regular expression will search for a potentially case-insensitive
    // string.
    function build_re(s, match_case, whole_words) {
        let r = s.replace(/\.|\^|\$|\\|\*|\+|\?|\{|\}|\(|\)|\[|\]/g, "\\$&");
        if (whole_words) {
            r = "\\b" + r + "\\b";
        }
        const flags = match_case ? "" : "i";
        return new RegExp(r, flags);
    }

    function create_details(ul, title) {
        const li = element(ul, "li");
        const details = element(li, "details");
        details.open = true;
        const summary = element(details, "summary");
        summary.textContent = title;
        return element(details, "ul");
    }

    function element(parent, kind) {
        const e = createElement(kind);
        parent.appendChild(e);
        return e;
    }

    function nth_last(n, haystack, needle, position) {
        let slice = haystack.slice(0, position);
        let r = -1;
        for (let i = 0; i < n; i++) {
            r = slice.lastIndexOf(needle);
            if (r === -1) {
                return -1;
            }
            slice = slice.slice(0, r);
        }
        return r;
    }

    function current_document() {
        let url = get_current_page();
        if (!url || !url.startsWith(base_uri)) {
            return null;
        }
        let relative = url.slice(base_uri.length);
        let first_slash = relative.indexOf('/');
        if (first_slash === -1) {
            return null;
        }
        return relative.slice(0, first_slash);
    }

    function toggle_search_results() {
        if (is_search_output_visible()) {
            hide_search_results();
        } else {
            show_search_results();
        }
    }

    function hide_search_results() {
        toggle_results_button.textContent = "Show";
        search_pane.classList.add("off-screen");
    }

    function show_search_results() {
        toggle_results_button.textContent = "Hide";
        search_pane.classList.remove("off-screen");
    }

    function is_search_output_visible() {
        return !search_pane.classList.contains("off-screen");
    }
}
