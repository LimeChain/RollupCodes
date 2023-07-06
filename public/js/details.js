var selectedSectionId = ''
var isScrolling = false
var sections = document?.querySelectorAll('div[data-element-type="section"]')
var sidebar = document.getElementById('sidebar')
var nav = document.getElementById('nav')
var hero = document.getElementById('hero')
var scrollToPosition = nav.offsetHeight + hero.offsetHeight

function removeActiveClassFromSidebarItem() {
    var elems = document.querySelectorAll(".sidebar-item-active");
    [].forEach.call(elems, function(el) {
        el.classList.remove("sidebar-item-active");
    });
}

function addActiveClassFromSidebarItem(id) {
    var elems = document.querySelectorAll(".sidebarItem");
    [].forEach.call(elems, function(el) {
        if (el.id === id) {
            el.classList.add('sidebar-item-active')
        }
    });
}

function scrollToSection(id) {
    sections.forEach((section) => {
        if (section.id === id) {
            window.location.hash = `#${section.id}`

            window.scrollTo({
                top: section.offsetTop - scrollToPosition,
                behavior: 'smooth'
            })
        }
    })
}

function applyPropsToExternalLinks() {
    document.querySelectorAll('#markdown a[href^="http"]').forEach((anchor) => {
        anchor.target = "_blank"

        // Adding an icon to the external links
        if (anchor.getElementsByTagName('svg').length === 0 && anchor.getElementsByTagName('img').length === 0) {
            let icon = document.createElement('img');
            icon.src = '../images/reference-icon.svg'
            icon.alt = 'reference icon'
            anchor.appendChild(icon)
        }
    })
}

function buildSidebar(){
    let sidebarItems = []

    sections.forEach((section) => {
        sidebarItems.push(section.querySelectorAll('div[data-element-type="section-title"]')[0].getAttribute("data-element-value"))
    })

    sidebarItems?.forEach((item) => {
        let link = document.createElement('a');
        link.className = 'sidebarItem'
        link.id = `${item.toLowerCase().replace(' ', '-')}`
        link.href = `#${item.toLowerCase().replace(' ', '-')}`
        link.innerText = item
        sidebar.appendChild(link)

        link.addEventListener("click", function(e){
            selectedSectionId = link.id
            e.preventDefault()
            scrollToSection(link.id)
        })
    })
}

// Links from sections headers
document.querySelectorAll('#markdown div[data-element-type="section-header"] a[href*="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function(e){
        selectedSectionId = anchor.id
        e.preventDefault()
        scrollToSection(anchor.id)
    })
})

function applyStylesAndActionsOnTable() {
    document?.querySelectorAll('table')?.forEach((table) => {
        table.setAttribute('cellspacing','0')
        table.setAttribute('borderCollapse','separate')

        const rows = table.querySelectorAll('tr')
        rows.forEach((row) => {
            const cells = row.querySelectorAll('td')

            // Makes row bottom border in the same color as icon's color
            if (cells.length > 0) {
                let className = ''
                cells.forEach((cell) => {
                    cells.forEach((cell) => {
                        if (cell.getElementsByTagName('div')[0]) {
                            className = `${cell.getElementsByTagName('div')[0].getElementsByTagName('svg')[0].getAttribute('data-type')}`
                        }
                    })
                    if(className) {
                        cell.className = className
                    }
                })
            }
        })
    })
}

function highlightSidebarItemOnScroll() {
    const sctollPosition = window.scrollY

    sections.forEach((section) => {
        if (window.scrollY - window.innerHeight < section.offsetTop && section.id === selectedSectionId) {
            removeActiveClassFromSidebarItem()
            addActiveClassFromSidebarItem(section.id)
            return
        }

        if (sctollPosition >= section.offsetTop - scrollToPosition) {
            removeActiveClassFromSidebarItem()
            addActiveClassFromSidebarItem(section.id)
        }
    })
}

function detectWhenScrollStopped() {
    window.clearTimeout( isScrolling );
	isScrolling = setTimeout(function() {
		selectedSectionId = ''
	}, 150);
}


// Invoked functions
applyStylesAndActionsOnTable ()
buildSidebar ()
applyPropsToExternalLinks()

// ====================================================
// Event listener for SCROLL
// ====================================================
window.addEventListener('scroll', function() {
    highlightSidebarItemOnScroll()
    detectWhenScrollStopped()
});