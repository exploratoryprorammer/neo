'use client'
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Box, Stack, TextField, Button, Modal, Typography, InputBase, Card } from "@mui/material";
import { fa42Group, faMeta } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


export default function Home() {

  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [pages, setPages] = useState(0);
  const [selast, setSelast] = useState(null);

  const [index, setIndex] = useState(null);
  const [modalopen, setModalopen] = useState(false);

  const handlemodalopen = (asteroid) => {
    setSelast(asteroid);
    setModalopen(true);
    setIndex(getNextApproachingDateIndex(asteroid.close_approach_data));
    console.log(index);
  }

  useEffect(() => {
    if (index !== null) {
      console.log(index); // This will log the updated index value after it has been set
    }
  }, [index]);

  const handlemodalclose = () => {
    setSelast(null);
    setModalopen(false);

  }


  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi Im the NASA asteroid detention A.I. assistant`
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

  useEffect(() => {
    const fetchNASAdata = async () => {
      try {
        const response = await fetch('https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=53NkhqrDI4PURDLYfDVzIAw7rvXSuUFE5o2a4Tyq');
        const result = await response.json();
        setData(result);
        setPages(result.page.total_pages)
      }
      catch (error) {
        console.log(error)
      }
    };

    fetchNASAdata();
  }, []);



  const getNextApproachingDate = (closeApproachData) => {
    // Get the current date
    const now = new Date();

    // Filter for dates in the future
    const futureApproaches = closeApproachData.filter(data => new Date(data.close_approach_date) > now);

    // Find the nearest date
    if (futureApproaches.length === 0) {
      return 'No future approaches';
    }

    const nextApproach = futureApproaches.reduce((earliest, current) => {
      return new Date(current.close_approach_date) < new Date(earliest.close_approach_date) ? current : earliest;
    });

    return nextApproach.close_approach_date_full;
  };

  const getNextApproachingDateIndex = (closeApproachData) => {
    // Get the current date
    const now = new Date();

    // Filter for dates in the future along with their index
    const futureApproaches = closeApproachData
      .map((data, index) => ({ ...data, index })) // Add index to each item
      .filter(({ close_approach_date }) => new Date(close_approach_date) > now);

    // Find the index of the nearest date
    if (futureApproaches.length === 0) {
      return 'No future approaches'; // Return a message or a default value when there are no future dates
    }

    const nextApproach = futureApproaches.reduce((earliest, current) => {
      return new Date(current.close_approach_date) < new Date(earliest.close_approach_date) ? current : earliest;
    });

    return nextApproach.index; // Return the index of the closest approach
  };









  return (
    <Box backgroundColor="black">
      <Typography
        variant="h1"
        color="white"
        fontFamily='Roboto'
        textAlign="center"
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={2}
      >
        <FontAwesomeIcon color="#1877F2" icon={faMeta} size="1.5x" />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg"
          alt="NASA Logo"
          style={{
            marginTop: '0',
            height: '100px',
            width: 'auto',
          }}
        />

        <Typography variant="h1">NEO - NEAR EARTH OBJECTS</Typography>
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'center',
          width: '100vw',
          height: '100vh',
          overflowY: 'auto',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        {data?.near_earth_objects.map((asteroid) => (
          <Box
            key={asteroid.id}
            sx={{
              width: '300px', // Fixed width for each card
              backgroundColor: 'white',
              color: 'black',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              p: 2,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
            onClick={() => handlemodalopen(asteroid)}
          >
            <Typography variant="h6">{asteroid.name}</Typography>
            <Typography variant="body2">ID : {asteroid.id}</Typography>
            <Typography variant="body2">Upcoming Approach : {getNextApproachingDate(asteroid.close_approach_data)} </Typography>

          </Box>
        ))}
      </Box>
      <Modal
        open={modalopen}
        onClose={handlemodalclose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'black',
            borderRadius: '8px',
            maxWidth: '800px',
            width: '700px',
            height: '700px',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Typography variant="h3" color="white">{selast?.name}</Typography>
          <Typography variant="h5" color="white">First Observation Date : {selast?.orbital_data.first_observation_date}</Typography>
          <Typography variant="h5" color="white">Last Observation Date : {selast?.orbital_data.last_observation_date}</Typography>
          <Typography variant="h5" color="white">Inclination : {selast?.orbital_data.inclination}</Typography>
          <Typography variant="h5" color="white">Equinox : {selast?.orbital_data.equinox}</Typography>
          <Typography variant="h5" color="white">Upcoming Approach Date: {selast?.close_approach_data[index].close_approach_date_full}</Typography>
          <Typography variant="h5" color="white">Upcoming Approach Speed: {selast?.close_approach_data[index].relative_velocity.miles_per_hour}</Typography>
          <Typography variant="h5" color="white">Upcoming Approach Miss Distance: {selast?.close_approach_data[index].miss_distance.miles}</Typography>
          <Typography variant="h6" color="white">"{selast?.orbital_data.orbit_class.orbit_class_description}"</Typography>




        </Box>
      </Modal>




      <Button
        variant="contained"
        style={{
          backgroundColor: "white",
          color: "black",
          position: "fixed", // Use 'fixed' instead of 'absolute'
          bottom: 16, // Adjust as needed
          right: 16, // Adjust as needed
          zIndex: 1000, // Ensure it's above other elements
        }}
        onClick={() => { handleopen(); }}
      >
       <FontAwesomeIcon icon={faMeta}/> 
      </Button>      
      <Modal
        open={open}
        onClose={handleclose}
      >
        <Box

          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          margin="50px"
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

