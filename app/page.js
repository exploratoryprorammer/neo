'use client'
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Box, Stack, TextField, Button, Modal } from "@mui/material";

export default function Home() {

  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi Im the U.S. 2024 presidential election AI assistant`
  }])

  const [message, setMessage] = useState('')

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])


  const sendMessage = async () => {
    setMessage('');
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])
    const response = fetch('api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, { role: 'user', content: message }]),
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let result = ''
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true })
        setMessages((messages) => {
          let lastMessages = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return ([
            ...otherMessages,
            {
              ...lastMessages,
              content: lastMessages.content + text
            },
          ])
        })
        return reader.read().then(processText)

      })
    })

  }

  const handleopen = () => setOpen(true);
  const handleclose = () => setOpen(false);






  return (
    <Box>
      <Button variant="contained" style={{backgroundColor: "white", color: "black"}} onClick={() => {handleopen()}}>AI</Button>
      <Modal
        open={open}
        onClose={handleclose}
      >
        <Box

          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Stack
            direction="column"
            width="500px"
            height="700px"
            border="1px solid black"
            p={2}
            spacing={3}
          >
            <Stack
              direction="column"
              spacing={2}
              flexGrow={1}
              overflow="auto"
              maxHeight="100%"
            >
              {messages.map((message, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent={
                    message.role === 'assistant' ? 'flex-start' : 'flex-end'
                  }
                >
                  <Box
                    bgcolor={
                      message.role === 'assistant'
                        ? 'primary.main'
                        : 'secondary.main'
                    }
                    color="white"
                    borderRadius={16}
                    p={3}
                  >
                    {message.content}

                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Message"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button variant="contained" onClick={sendMessage}>
                Send

              </Button>
            </Stack>


          </Stack>
        </Box>
      </Modal>
    </Box>



  )
}
