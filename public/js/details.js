function buildSidebar(){
    let sidebarItems = []
    const sidebar = document.getElementById('sidebar')

    const sections = document?.querySelectorAll('div[data-element-type="section"]')
    sections.forEach((section) => {
        sidebarItems.push(section.querySelectorAll('div[data-element-type="section-title"]')[0].getAttribute("data-element-value"))
    })

    sidebarItems?.map((item) => {
        let link = document.createElement('a');
        link.className = 'sidebarItem'
        link.id = `${item.toLowerCase().replace(' ', '-')}`
        link.href = `#${item.toLowerCase().replace(' ', '-')}`
        link.innerText = item
        link.scroll = false
        sidebar.appendChild(link)
    })
}

buildSidebar ()

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

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function(e){
        e.preventDefault()
        const sections = document?.querySelectorAll('div[data-element-type="section"]')
        sections.forEach((section) => {
            if (section.id === anchor.id) {
                section.scrollIntoView({
                    behavior: 'smooth'
                })
            }
        })
        removeActiveClassFromSidebarItem()
        anchor.classList.add('sidebar-item-active')
    })
})

document.querySelectorAll('#markdown a[href*="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function(e){
        e.preventDefault()
        const sections = document?.querySelectorAll('div[data-element-type="section"]')
        sections.forEach((section) => {
            if (section.id === anchor.id) {
                section.scrollIntoView({
                    behavior: 'smooth'
                })
                removeActiveClassFromSidebarItem()
                addActiveClassFromSidebarItem(section.id)
            }
        })
        
        // anchor.classList.add('sidebar-item-active')
    })
})

document?.querySelectorAll('table')?.forEach((table) => {
    table.setAttribute('cellspacing','0')
    table.setAttribute('borderCollapse','separate')
    const theme = localStorage.getItem('theme')

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

        function hoverOnRow (src) {
            const cells = row.querySelectorAll('td')
            if (cells.length > 0 && cells[0].getElementsByTagName('img').length > 0) {
                const img = cells[0].getElementsByTagName('img')[0]
                img.src = src
            }
        }

        row.addEventListener('mouseover', function() {
            hoverOnRow(`../images/link-icon-${theme}-active.png`)
        })

        row.addEventListener('mouseout', function() {
            hoverOnRow('../images/link-icon.png')
        })
       
    })
})

function controlSidebarBehaviour() {
    const nav = document.getElementById('nav')
    const hero = document.getElementById('hero')
    const sidebar_placeholder = document.getElementById('sidebar_placeholder')

    if (window.location.pathname === '/') {
        return
    }
    
    if (window.scrollY >= nav.offsetHeight + hero.offsetHeight) {
        sidebar?.classList.add('sticky')
        sidebar_placeholder?.classList.add('sidebar_placeholder_visible')
    } else {
        sidebar?.classList.remove('sticky')
        sidebar_placeholder?.classList.remove('sidebar_placeholder_visible')
    }
}

function highlightSidebatItemOnScroll() {
    const sctollPosition = window.scrollY
    const sections = document?.querySelectorAll('div[data-element-type="section"]')

    sections.forEach((section) => {
        if (section.offsetHeight + section.offsetTop - 5 >= sctollPosition && sctollPosition >= section.offsetTop) {
            removeActiveClassFromSidebarItem()
            addActiveClassFromSidebarItem(section.id)
        }
    })
}

window.addEventListener('scroll', function() {
    controlSidebarBehaviour()

    highlightSidebatItemOnScroll()
});

window.addEventListener('resize', function() {
    const sidebar_placeholder = document.getElementById('sidebar_placeholder')

    if (window.innerWidth < 1024) {
        sidebar_placeholder.style.display = 'none !important'
    }
})