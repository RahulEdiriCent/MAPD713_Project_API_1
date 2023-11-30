//Code for Milestone 3 for MAPD713 : Group 13
//By Kajal Patel and Rahul Edirisinghe

let SERVER_NAME = 'weCare-api' //server name
let PORT = 4000; //chosen server port
let HOST = '127.0.0.1'; //chosen server address (for this project)

//create reference objects for restify and restify-errors

const mongoose = require('mongoose')
//mongodb connector string:
const CONNECTER_STRING = "mongodb+srv://cente713User_1:4MmB74RofHDl9iY3@map713-712projectdb.jgu68kw.mongodb.net/";

mongoose.connect(CONNECTER_STRING, {useNewUrlParser: true});
const mongodb_weCare = mongoose.connection;

mongodb_weCare.on('Error', console.error.bind(console, '!CONNECTION ERROR! ::'))
mongodb_weCare.once('open', ()=>{
    //if connected to MongoDB
    console.log('Connection to MongoDB established!')
});

//We will be using a nested schema for pateints where they will hold all the test data needed.

//fisrt make schema for tests (clinical test data)
const clinicalTestSchema = new mongoose.Schema({
    testId:String,
    patientId:String,
    status: String,
    testDate:Date,
    nurse_name: String,
    type:String,
    category:String,
    readings:[[String]]
})

//then create schema for the pateint records/data
const patientSchema = new mongoose.Schema({
        patientId:{
            type: String, //chenged to number to allow for auto-increament purposes for the id
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
        doctor:String,
        tests:[clinicalTestSchema]//creating an array/list of testSchema objects
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

//===============================P A T I E N T S=========================================
//----------------------------ADD NEW PATIENT------------------------------------

//Add new patient into the system/database
server.post('/patients', function(req, res, next){
    console.log("POST -> Create new patient Record")
    let testsHoldValue = [];
    if(req.body.tests && req.body.tests != testsHoldValue){
        testsHoldValue = req.body.tests
    }

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
            doctor: req.body.doctor,
            tests: testsHoldValue
        })
        //add the patient record through mongoose->mongodb save function
        newPatientRecord.save().then((addedPatient)=>{
            //if no errors proceed to display relevant messages and send succesfull response
            console.log("Record:" + addedPatient);
            //send newly created/added patient record alongside corresponding status code
            res.send(201,addedPatient);
            testsHoldValue = [];
            return next();
        }).catch((addPatientError)=>{
            //if error occurred, then send a Error message and go to next function
            console.log('An Error occured while creating Patient Record: ' + addPatientError)
        })
})

//--------------------------- GET ALL PATIENTS ----------------------------
server.get('/patients', function(req,res,next){
    
    console.log("Get-> ALL Patients")
    //function to find patients in the mongodb database
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

//----------------------- GET PATIENTS BY CONDITION ---------------------------------
server.get('/patients/search/condition/:filter', function(req,res,next){
    console.log("Get -> Patients using Patient Condition" + req.params.filter);

    //function to find patients with a particular condition: Normal or Critical
    PatientsModel.find({condition: req.params.filter}).then((filteredPatients)=>{
        //check if matching Patients was found
        if(filteredPatients){
            console.log("Found Patients in " + req.params.filter + " condition")
            res.send(filteredPatients);
        }else{
            //if not then:
            console.log("Unable to find patients with that condition")
            res.send(404, "Patients Not Found");
        }
    }).catch((filterError)=>{//check for errors
        //if error occurred, then send a Error message and go to next function
        console.log('An Error occured while searching for Patient Records: ' + filterError);
        return next (new Error(JSON.stringify(filterError.errors)))
    });
});

//----------------------- GET PATIENT(s) BY NAME ---------------------------------
//This function is to get patients by using name as a search condition
server.get('/patients/search/name/:name',function(req,res,next){
    console.log("Get-> Pateints using Name");

    PatientsModel.find({ $or:[
        {firstName: req.params.name},//if it matches either first or last name
        {lastName: req.params.name}
    ]}).then((foundPatientsByName)=>{
        //check if matching Patients was found
        if(foundPatientsByName){
        //If so then return those found values
            console.log("Found Patients By Name")
            res.send(foundPatientsByName)
        }else{
             //if not then:
            console.log("Unable to find Patients with that name");
            res.send(404,"No Patients Found")
        }
    }).catch((findPatientsByNameError)=>{
    //if error occurred, then send a Error message and go to next function
        console.log('An Error occured while searching for Patient Records: ' + findPatientsByNameError);
        return next (new Error(JSON.stringify(findPatientsByNameError.errors)))
    });
});

//----------------------- GET PATIENT BY ID ---------------------------------
server.get('/patients/:id', function(req,res,next){

    console.log("GET -> Patient using patientId")
    //function to find patients using patientid
    PatientsModel.findOne({patientId: req.params.id}).then((fetchedPatient)=>{
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
    
    console.log("Put-> Editing Patient Record")
  //will now be using patientId as the id to be used in searches as _id is used by mongodb for internal
  //object identification

  // Update the patient record in the system
  PatientsModel.findOneAndUpdate({patientId: req.params.id}, 
    req.body, //use passed over information to update
    {new:true}).then((updatedPatient) => {
        if(updatedPatient){
        //send 200 status code to indicate successful update  
        console.log("Found Patient:" + updatedPatient)
        res.send(200, updatedPatient);
        }else{
            console.log("Unable to find patient to Edit with that Id")
            res.send(404, "Patient Not Found");
        }
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


//================================== T E S T S =======================================

//--------------------------- GET ALL TESTS FOR PATIENT ----------------------------
server.get('/patients/:pid/tests', function(req,res,next){
    
    console.log("Get-> ALL Tests for a Patient = " + req.params.pid)
    //function to find patient, return all test Data for that patient
    PatientsModel.findOne({patientId:req.params.pid}).then((patientAllTests)=>{
            if(patientAllTests){//if patient was found
                //then indicate:
                console.log("Found Patient:" + patientAllTests)
                //and return the test array of the patient
                res.send(patientAllTests.tests);
            }else{
                //if not found then display error:
                console.log("No Tests Avaialable for this patient");
                res.send(404, "Patient Not Found");
            }
        return next();
    }).catch((getAllTestsError)=> {  
        //if an error occurred, return the error message and go to next function       
        console.log('An Error occured while cent Record: ' + getAllTestsError);
        return next(new Error(JSON.stringify("ERROR! " + getAllTestsError.errors)))
    })
})


//----------------------- GET TEST BY TEST ID ---------------------------------
server.get('/patients/:pid/tests/:tid', function(req,res,next){

    console.log("Get-> ALL Tests for a Patient = " + req.params.pid)
    //function to find patient, return test Data
    PatientsModel.findOne({patientId:req.params.pid}).then((patientAllTests)=>{
            if(patientAllTests){
                console.log("Found Patient:" + patientAllTests)
                //------------------
            res.send(patientAllTests.tests.find(t => t.testId === req.params.tid));
            }else{
                console.log("No Tests Avaialable for this patient");
                res.send(404, "Patient Not Found");
            }
        //if no errors proceed to display fetched patients:
        return next();
    }).catch((getAllTestsError)=> {  
        //if an error occurred, return the error message and go to next function       
        console.log('An Error occured while cent Record: ' + getAllTestsError);
        return next(new Error(JSON.stringify("ERROR! " + getAllTestsError.errors)))
    })

});

//----------------------------ADD NEW TEST FOR PATIENT------------------------------------
server.post('/patients/:pid/tests', function(req, res, next){
    console.log("POST -> Create new Test record for a patient Record")

        //First need to get the patient record and then update it with the new test record pushed
        //into the tests object list
        let newTest = req.body
        var newCondition = checkIfCritical(newTest);


        PatientsModel.findOneAndUpdate({patientId: req.params.pid}, 
           { $push: {tests: newTest}, $set: {condition: newCondition}}, //use passed over information to update -> push new test data
            {new:true}).then((updatedPatientWithNewTest) => {
                if(updatedPatientWithNewTest){
                //send 200 status code to indicate successful update  
                //console.log("Found Patient:" + updatedPatientWithNewTest)
                res.send(200, updatedPatientWithNewTest);
                }else{
                    console.log("Unable to find patient with that Id")
                    res.send(404, "Patient Not Found");
                }
            }).catch((addTestForPatientError)=>{
                //if error occurred, then send a Error message and go to next function
                console.log('An Error occured while creating Test Record: ' + addTestForPatientError)
                return next(new Error(JSON.stringify("ERROR! " + addTestForPatientError.errors)))
            });
})


function checkIfCritical(testToCheck){
    var conditionAfterCheck = "Normal";
    let readings = testToCheck.readings;
    switch(testToCheck.category){
        case "Blood Test": //Pressure
            let bpr1 = Number(readings[0][1]);
            let bpr2 = Number(readings[1][1]);
        
            console.log(bpr1 + " " + bpr2)
            if((bpr1 < 50 || bpr1 > 60) || (bpr2 < 90 || bpr2 > 120)){
                console.log("Patient is now Critical")
                conditionAfterCheck = "Critical";
            }else{
                console.log("Patient is still Normal")
            }

            break;
        case "Respiratory Rate": break;
        case "Blood Oxygen Level": break;
        case "Heart Beat Rate":
            let hbrr1 = Number(readings[0][1]);
            let hbrr2 = readings[1][1];
        
            console.log(hbrr1 + " " + hbrr2)
            if((hbrr1 < 60 || hbrr1 > 100) || (hbrr2 == "Irregular")){
                console.log("Patient is now Critical")
                conditionAfterCheck = "Critical";
            }else{
                console.log("Patient is still Normal")
            }
            break;
        default:
            conditionAfterCheck = "Normal";
            break;
    }
    return conditionAfterCheck;
}
//

//----------------------------DELETE ALL EXISTING TEST RECORDS FOR PATIENT RECORD------------------------------------
server.del('/patients/:pid/tests', function(req,res,next){
    //delete all tests as below:
    
    console.log("Delete-> ALL Tests for a Patient = " + req.params.pid)
    //function to find patient, return test Data
    PatientsModel.findOneAndUpdate({patientId: req.params.pid}, 
        { $unset: {tests: 1}}, //this is used to remove all stored objects in the testes object list/array
        //therefore deleting all test information
         {new:true}).then((updatedPatientWithoutAllTests) =>{
            if(updatedPatientWithoutAllTests){
                //if patient was found:
                console.log("Found Patient:" + updatedPatientWithoutAllTests)
                console.log("All Test Data for Patient Successfully Deleted")
                res.send(updatedPatientWithoutAllTests.tests);
            }else{
                //if not found:
                console.log("No Tests Avaialable for this patient");
                res.send(404, "Patient Not Found");
            }
        //if no errors proceed to display fetched patients:
        return next();
    }).catch((getllTestsToDeleteError)=> {  
        //if an error occurred, return the error message and go to next function       
        console.log('An Error occured while cent Record: ' + getllTestsToDeleteError);
        return next(new Error(JSON.stringify("ERROR! " + getllTestsToDeleteError.errors)))
    })
});

//----------------------------DELETE EXISTING TEST RECORD BY ID FOR PATIENT RECORD------------------------------------
server.del('/patients/:pid/tests/:tid', function(req, res, next){
    console.log("Delete -> Delete a test using Id from a patient Record")

        //add the patient record through mongoose->mongodb save function
        PatientsModel.findOneAndUpdate({patientId: req.params.pid}, 
           { $pull: {tests: {testId: req.params.tid}}}, //pull, to remove that element from object list/array tests: delete specific test
            {new:true}).then((updatedPatientWithoutTest) => {
                if(updatedPatientWithoutTest){//if patient found
                //send 200 status code to indicate successful update  
                console.log("Found Patient:" + updatedPatientWithoutTest)
                res.send(200, updatedPatientWithoutTest);
                }else{
                    console.log("Unable to find patient with that Id")
                    res.send(404, "Patient Not Found");
                }
            }).catch((deleteOneTestForPatientError)=>{
                //if error occurred, then send a Error message and go to next function
                console.log('An Error occured while creating Test Record: ' + deleteOneTestForPatientError)
                return next(new Error(JSON.stringify("ERROR! " + deleteOneTestForPatientError.errors)))
            });
})