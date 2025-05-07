const mongoose = require('mongoose');
const { dbConnect } = require('./lib/db');
const Affidavit = require('./lib/models/affidavit');

async function fixAffidavitStatus() {
  try {
    // Connect to MongoDB
    await dbConnect();
    console.log('Connected to MongoDB');

    // Find all affidavits missing the status field
    const affidavitsToUpdate = await Affidavit.find({ status: { $exists: false } });

    if (affidavitsToUpdate.length === 0) {
      console.log('No affidavits found with missing status field');
      return;
    }

    console.log(`Found ${affidavitsToUpdate.length} affidavits with missing status field`);

    // Update each affidavit with a default status
    const updatePromises = affidavitsToUpdate.map(async (affidavit) => {
      affidavit.status = 'Accepted'; // Default to 'Accepted' or another appropriate value
      await affidavit.save();
      console.log(`Updated affidavit with ID ${affidavit._id} to have status: ${affidavit.status}`);
    });

    await Promise.all(updatePromises);
    console.log('All affidavits updated successfully');
  } catch (error) {
    console.error('Error updating affidavits:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

fixAffidavitStatus();