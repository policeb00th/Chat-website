const socket = io()

// HTML Elements
const ChatForm = document.querySelector('#message-form')
const ChatFormInput = ChatForm.querySelector('input')
const ChatFormButton = ChatForm.querySelector('button')
const sendLocationButton = document.querySelector('#send-location')
const messages = document.querySelector('#messages')

// Templates
const locationTemplate = document.querySelector('#location-template').innerHTML
const messageTemplate = document.querySelector('#message-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

// Options
const{username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoScroll =() =>{
    // New message element
    const newMessage=messages.lastElementChild

    // Height of the new message
    const newMessageStyles= getComputedStyle(newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight= newMessage.offsetHeight +newMessageMargin
    console.log(newMessageMargin)

    // Visible Height
    const visibleHeight=messages.offsetHeight

    // height of messages container
    const containerHeight=messages.scrollHeight

    // how far have I scrolled?
    const scrollOffset=messages.scrollTop + visibleHeight

    if(containerHeight-newMessageHeight<=scrollOffset){
        messages.scrollTop=messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username:message.username,
        message: message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()

})
socket.on('locationMessage', (url) => {
    const html = Mustache.render(locationTemplate, {
        username:url.username,
        url:url.url,
        createdAt:moment(url.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})
socket.on('roomData',({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html
})

ChatForm.addEventListener('submit', (e) => {
    e.preventDefault()

    ChatFormButton.setAttribute('disabled', 'disabled')

    // const message = input.value
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        ChatFormButton.removeAttribute('disabled')
        ChatFormInput.value = ''
        ChatFormInput.focus()

        if (error) {
            return console.log(error)
        }
        console.log('message delivered')
    })
})

sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return console.log('Geolocation is not supported by browser')
    }
    sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location delivered')
            sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})