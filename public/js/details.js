const collapses = document?.querySelectorAll('div[data-element-type="collapse"]')
let sidebarItems = []
collapses.forEach((collapse) => {
    sidebarItems.push(collapse.querySelectorAll('div[data-element-type="collapse-button"]')[0].getAttribute("data-element-value"))
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