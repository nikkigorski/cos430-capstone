// Import the necessary modules for MySQL connection and environment variable management
import mysql from 'mysql2'
import dotenv from 'dotenv'
import { User, Patient, Doctor, Admin } from './classes.js'

// Load environment variables from the .env file
dotenv.config()

// Create a connection pool to MySQL database using values from environment variables
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,           // MySQL host (e.g., localhost)
  user: process.env.MYSQL_USER,           // MySQL user
  password: process.env.MYSQL_PASSWORD,   // MySQL password
  port: process.env.MYSQL_PORT,           // MySQL port (default: 3306)
  database: process.env.MYSQL_DATABASE    // MySQL database name
}).promise()  // Return a promise-based connection pool

// test database connection
export async function testDatabaseConnection() {
  try {
    const [rows] = await pool.query('SELECT * FROM doctors'); // Execute a simple query
    console.log('Database connection successful:', rows);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Create user in database
export async function createUser(userData) {
  try {
    // First create User instance with hashed password
    const user = await User.create(
      userData.first_name,
      userData.last_name,
      userData.email,
      userData.password
    );

    const [result] = await pool.query(`
      INSERT INTO users
      (first_name, last_name, email, password)
      VALUES (?, ?, ?, ?)
    `, [
      user.first_name,
      user.last_name,
      user.email,
      user.password
    ]);

    return result;
  } catch (error) {
      console.error('Error creating user:', error);
      throw error;
  }
}

export async function createDoctor(doctorData) {
  try {
    // First create Doctor instance with hashed password
    const doctor = await Doctor.create(
      doctorData.first_name,
      doctorData.last_name,
      doctorData.email,
      doctorData.password
    );

    // First, create a user account
    const username = doctorData.email; // Use email as username
    const [userResult] = await pool.query(`
      INSERT INTO users (username, password, name)
      VALUES (?, ?, ?)
    `, [
      username,
      doctor.password,
      `${doctor.first_name} ${doctor.last_name}`
    ]);
    
    const userId = userResult.insertId;

    // Then create the doctor record linked to the user
    const [result] = await pool.query(`
      INSERT INTO doctors
      (user_id, first_name, last_name, email)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      doctor.first_name,
      doctor.last_name,
      doctor.email
    ]);

    return result;
  } catch (error) {
      console.error('Error creating user:', error);
      throw error;
  }
}

export async function createPatient(patientData) {
  try {
    // First create Patient instance with hashed password
    const patient = await Patient.create(
      patientData.first_name,
      patientData.last_name,
      patientData.email,
      patientData.password
    );

    // First, create a user account
    const username = patientData.email; // Use email as username
    const [userResult] = await pool.query(`
      INSERT INTO users (username, password, name)
      VALUES (?, ?, ?)
    `, [
      username,
      patient.password,
      `${patient.first_name} ${patient.last_name}`
    ]);
    
    const userId = userResult.insertId;

    // Then create the patient record linked to the user
    const [result] = await pool.query(`
      INSERT INTO patients
      (user_id, first_name, last_name, email)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      patient.first_name,
      patient.last_name,
      patient.email
    ]);

    return result;
  } catch (error) {
      console.error('Error creating user:', error);
      throw error;
  }
}

// Fetch and return a list of patients by their doctor's ID
export async function getPatientList(id) {
  const [rows] = await pool.query(
    "SELECT * FROM patients WHERE primary_doctor_id = ?",
    [id]
  );
  return rows;
}

// Fetch and return a list of all doctors from the 'doctors' table
export async function getDoctorList() {
  const [rows] = await pool.query("SELECT * FROM doctors")   // Query to get all doctors
  return rows  // Return the list of doctors
}

// Fetch and return a specific patient by their patient ID
export async function getPatient(id) {
  const [rows] = await pool.query(`
    SELECT * 
    FROM patients
    WHERE patient_id = ?  // Use a parameterized query to avoid SQL injection
  `, [id])  // Pass the patient ID as a parameter
  return rows[0]  // Return the patient object (only one result)
}

// Fetch and return a specific patient by their email
export async function getPatientByEmail(email) {
  try {
    const [rows] = await pool.query(`
      SELECT * 
      FROM patients
      WHERE email = ?  // Use a parameterized query to avoid SQL injection
    `, [email]);  // Pass the email as a parameter

    return rows[0];  // Return the first matching patient (or undefined if no match)
  } catch (error) {
    console.error('Error fetching patient by email:', error);
    throw error;
  }
}

// Fetch and return a specific doctor by their doctor ID
export async function getDoctor(id) {
  const [rows] = await pool.query(`
    SELECT * 
    FROM doctors
    WHERE doctor_id = ?  // Use a parameterized query to avoid SQL injection
  `, [id])  // Pass the doctor ID as a parameter
  return rows[0]  // Return the doctor object (only one result)
}

export async function prescibe(patientId, prescriptionData) {
  const [result] = await pool.query(`
    INSERT INTO medication 
    (patient_id, medication_name, dosage, frequency, start_date, end_date) 
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    patientId,
    prescriptionData.medicationName,
    prescriptionData.dose,
    prescriptionData.frequency,
    prescriptionData.startDate,
    prescriptionData.endDate
  ]);

  return result;
}

// Export the pool for use in other parts of the application
export default pool;

