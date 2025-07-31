const mongoose = require('mongoose');
const ThoughtOfTheDay = require('./models/ThoughtOfTheDay');
const User = require('./models/User');

// Sample thoughts of the day
const sampleThoughts = [
  {
    thought: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King"
  },
  {
    thought: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela"
  },
  {
    thought: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi"
  },
  {
    thought: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    author: "Dr. Seuss"
  },
  {
    thought: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin"
  },
  {
    thought: "Tell me and I forget, teach me and I may remember, involve me and I learn.",
    author: "Benjamin Franklin"
  },
  {
    thought: "The only thing that interferes with my learning is my education.",
    author: "Albert Einstein"
  },
  {
    thought: "Learning never exhausts the mind.",
    author: "Leonardo da Vinci"
  },
  {
    thought: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert"
  },
  {
    thought: "Education is not preparation for life; education is life itself.",
    author: "John Dewey"
  },
  {
    thought: "It is impossible for a man to learn what he thinks he already knows.",
    author: "Epictetus"
  },
  {
    thought: "The expert in anything was once a beginner.",
    author: "Helen Hayes"
  },
  {
    thought: "Study while others are sleeping; work while others are loafing; prepare while others are playing; and dream while others are wishing.",
    author: "William Arthur Ward"
  },
  {
    thought: "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.",
    author: "Pelé"
  },
  {
    thought: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch"
  },
  {
    thought: "I am always doing that which I cannot do, in order that I may learn how to do it.",
    author: "Pablo Picasso"
  },
  {
    thought: "The beautiful thing about learning is nobody can take it away from you.",
    author: "B.B. King"
  },
  {
    thought: "Wisdom is not a product of schooling but of the lifelong attempt to acquire it.",
    author: "Albert Einstein"
  },
  {
    thought: "Change is the end result of all true learning.",
    author: "Robin Sharma"
  },
  {
    thought: "Learning is a treasure that will follow its owner everywhere.",
    author: "Chinese Proverb"
  }
];

async function seedThoughts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library-management');
    console.log('Connected to MongoDB');

    // Find a superadmin user to assign as creator
    const superAdmin = await User.findOne({ role: 'superadmin' });
    if (!superAdmin) {
      console.error('No superadmin user found. Please create a superadmin user first.');
      process.exit(1);
    }

    console.log(`Using superadmin: ${superAdmin.name || superAdmin.email}`);

    // Clear existing thoughts
    await ThoughtOfTheDay.deleteMany({});
    console.log('Cleared existing thoughts');

    // Insert sample thoughts
    const thoughtsToInsert = sampleThoughts.map((thought, index) => ({
      thought: thought.thought,
      author: thought.author,
      order: index + 1,
      isActive: true,
      createdBy: superAdmin._id
    }));

    const insertedThoughts = await ThoughtOfTheDay.insertMany(thoughtsToInsert);
    console.log(`Successfully inserted ${insertedThoughts.length} thoughts of the day`);

    // Display today's thought
    const todaysThought = await ThoughtOfTheDay.getThoughtForDate();
    console.log('\n--- Today\'s Thought ---');
    console.log(`"${todaysThought.thought}"`);
    console.log(`— ${todaysThought.author}`);
    console.log('----------------------\n');

    console.log('Seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding thoughts:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding function
seedThoughts();