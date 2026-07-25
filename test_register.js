const payload = {
  teamName: "AwesomeTeam124",
  leader: {
    name: "Devang Patel",
    email: "devangpatel1972003@gmail.com",
    phone: "9876543210",
    gender: "Male",
    enrollment: "ENR123456",
    branch: "Computer Science",
    year: "3rd Year"
  },
  members: [
    { name: "Alice", email: "alice@example.com", phone: "9876543211", gender: "Female", enrollment: "ENR001", branch: "IT", year: "3rd Year" },
    { name: "Bob", email: "bob@example.com", phone: "9876543212", gender: "Male", enrollment: "ENR002", branch: "CS", year: "2nd Year" },
    { name: "Charlie", email: "charlie@example.com", phone: "9876543213", gender: "Male", enrollment: "ENR003", branch: "CS", year: "3rd Year" },
    { name: "Dave", email: "dave@example.com", phone: "9876543214", gender: "Male", enrollment: "ENR004", branch: "EC", year: "4th Year" },
    { name: "Eve", email: "eve@example.com", phone: "9876543215", gender: "Female", enrollment: "ENR005", branch: "IT", year: "1st Year" }
  ]
};

async function testRegistration() {
  console.log('Sending registration request to local API...');
  const res = await fetch('http://localhost:3000/api/registration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const text = await res.text();
  console.log('Response Status:', res.status);
  console.log('Response Body:', text);
}

testRegistration();
