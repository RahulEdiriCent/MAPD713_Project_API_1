//Code for Milestone 2 for MAPD713
//By Kajal Patel and Rahul Edirisinghe

let SERVER_NAME = 'weCare-api' //server name
let PORT = 4000; //chosen server port
let HOST = '127.0.0.1'; //chosen server address (for this project)

//create reference objects for restify and restify-errors

const mongoose = require('mongoose')
const CONNECTER_STRING = "mongodb+srv://cente713User_1:4MmB74RofHDl9iY3@map713-712projectdb.jgu68kw.mongodb.net/";

mongoose.connect(CONNECTER_STRING, {useNewUrlParser: true});
const mongodb_weCare = mongoose.connection;

mongodb_weCare.on('Error', console.error.bind(console, '!CONNECTION ERROR! ::'))
mongodb_weCare.once('open', ()=>{
    //if connected to MongoDB
    console.log('Connection to MongoDB established!')
});
const patientSchema = new mongoose.Schema({
        patientId:{
            type: Number, //chenged to number to allow for auto-increament purposes for the id
            unique: true
        },
        firstName: String,
        lastName: String,
        age: Number,
        gender: String,
        phoneNumber:String,
        address: String,
        date_of_birth: Date,
        department: String,
        condition:String,
        doctor:String
});

let PatientsModel = mongoose.model('Patients', patientSchema);


let errors = require('restify-errors');
let restify = require('restify')


  // Get a persistence engine for the products
  , weCareProjectDB = require('save')('patients')

  // Create the restify server
  , server = restify.createServer({ name: SERVER_NAME})

  server.listen(PORT, HOST, function () {
  console.log('Server %s listening at %s', server.name, server.url)
});

server.use(restify.plugins.fullResponse());
server.use(restify.plugins.bodyParser());

//----------------------------ADD NEW PATIENT------------------------------------
server.post('/patients', function(req, res, next){
    console.log("POST -> Create new patient Record")

    PatientsModel.findOne()
        // create new patient object using created mongoose schema
        let newPatientRecord = new PatientsModel({
            patientId: req.body.patientId, //change later to be auto-number
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            age: req.body.age,
            gender:req.body.gender,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            date_of_birth: req.body.date_of_birth,
            department: req.body.department,
            condition: req.body.condition, //temp placement here as to allow for condition handling
            doctor: req.body.doctor
        })

        //add the patient record through mongoose->mongodb save function
        newPatientRecord.save().then((addedPatient)=>{
            //if no errors proceed to display relevant messages and send succesfull response
            console.log("Record:" + addedPatient);
            //send newly created/added patient record alongside corresponding status code
            res.send(201,addedPatient);
            return next();
        }).catch((addPatientError)=>{
            //if error occurred, then send a Error message and go to next function
            console.log('An Error occured while creating Patient Record: ' + addPatientError)
        })
})

//--------------------------- GET ALL PATIENTS ----------------------------
server.get('/patients', function(req,res,next){
    
    console.log("Get-> ALL Patients")
    //function to find patients
    PatientsModel.find({}).then((allPatients)=>{
        //if no errors proceed to display fetched patients:
        res.send(allPatients)
        return next();
    }).catch((getAllError)=> {  
        //if an error occurred, return the error message and go to next function       
        console.log('An Error occured while creating Patient Record: ' + getAllError);
        return next(new Error(JSON.stringify("ERROR! " + getAllError.errors)))
    })
})

//----------------------- GET PATIENT BY ID ---------------------------------
server.get('/patients/:id', function(req,res,next){

    console.log("GET -> Patient using _id")
    //function to find patients using _id
    PatientsModel.findOne({_id: req.params.id}).then((fetchedPatient)=>{
        //check if a matching Patient was found
        if(fetchedPatient) {
            //if found return found patient details
            console.log("Found Patient:" + fetchedPatient)
            res.send(fetchedPatient);
        }else{
            //if not then:
            console.log("Unable to find patient with that Id")
            res.send(404, "Patient Not Found");
        }
        return next();
    }).catch((findOneError)=>{//check for errors
        //if error occurred, then send a Error message and go to next function
        console.log('An Error occured while creating Patient Record: ' + findOneError);
        return next (new Error(JSON.stringify(findOneError.errors)))
    })

});

//---------------------------- EDIT EXISTING PATIENT ------------------------------------
server.put('/patients/:id', function (req, res, next) {
 
  //check if patient exists and update if it does exist
  //_id is not a number but stored as a string

  //will now be using patientId as the id to be used in searches
  let updatePatientRecord = new PatientsModel ({
    patientId: req.params.id, //change later to be uneditable 
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    age: req.body.age,
    gender:req.body.gender,
    phoneNumber: req.body.phoneNumber,
    address: req.body.address,
    date_of_birth: req.body.date_of_birth,
    department: req.body.department,
    condition: req.body.condition, //temp placement here as to allow for condition handling
    doctor: req.body.doctor
  })

  // Update the patient record in the system
  PatientsModel.findOneAndUpdate({patientId: req.params.id}, 
    {updatePatientRecord},
    {new:true}).then((updatedPatient) => {
        //send 200 status code to indicate successful update  
        console.log("Found Patient:" + updatedPatient)
        res.send(200, updatedPatient);
    }).catch((updateError)=>{
        //if error occurred, then send a Error message and go to next function
        console.log("An Error occurred while updating Patient" + updateError);
        return next(new Error(JSON.stringify("ERROR! " + updateError.errors)))
    });
})


//----------------------------DELETE ALL EXISTING PATIENT RECORDS------------------------------------
server.del('/patients', function(req,res,next){
   
    //delete all using deleteMany function of database
    PatientsModel.deleteMany({}).then(()=>{
        //if no errors then send correct status to indicate successful delete operation
        console.log("All Patients Successfully Deleted")
        res.send(200, "All Patients Deleted")
    }).catch((deleteAllError)=>{
        // If there are any errors, pass them to next in the correct format
        console.log("An Error Occurred while deleting all Patient Records" + deleteAllError)
        return next(new Error(JSON.stringify("ERROR! " + deleteAllError.errors)))
    })
});


//----------------------------DELETE AN EXISTING PATIENT RECORD USING ID------------------------------------
server.del('/patients/:id', function(req,res,next){
   console.log("DELETE -> Patient using Id")
    //find and delete patient record using mongoose->mongodb function findOneAndDelete
    PatientsModel.findOneAndDelete({patientId:req.params.id}).then((deletedPatient)=>{
        //check if matching  patinet was found
        if(deletedPatient){
            //if found and deleted succesfully then:
            console.log("Successfully Deleted Patient" + deletedPatient);
            //send newly deleted patient record alongside corresponding status code
            res.send(200, deletedPatient);
        }else{
            //if not found then
            console.log("Unable to find Patient with that Id")
            //send status code with error message
            res.send(404,"Patient Not Found")
        }
    }).catch((deleteOneError)=>{
        // If there are any errors, pass them to next in the correct format
        console.log("An Error occured while creating Patient Record: " + deleteOneError)
        return next(new Error(JSON.stringify(deleteOneError.errors)))
    })
    
});