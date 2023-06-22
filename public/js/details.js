const sections = document?.querySelectorAll('div[data-element-type="section"]')
let sidebarItems = []
sections.forEach((section) => {
    sidebarItems.push(section.querySelectorAll('div[data-element-type="section-button"]')[0].getAttribute("data-element-value"))
})

const sidebar = document.getElementById('sidebar')
sidebarItems?.map((item) => {
    let link = document.createElement('a');
    link.className = 'sidebarItem'
    link.href = `#${item.toLowerCase().replace(' ', '-')}`
    link.innerText = item
    link.scroll = false
    sidebar.appendChild(link)
})

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function(e){
        e.preventDefault()
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        })
    })
})