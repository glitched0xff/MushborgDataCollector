const socket=require("../config/socket")

const socketSendMessage = async(topic,payload)=>{
    console.log("sendsock")
    console.log(topic)
    console.log(payload)

    socket.emit(topic, {
        payload: payload.toString()
    })

}

module.exports={socketSendMessage}