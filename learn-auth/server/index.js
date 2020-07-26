const app = require("express")();
const morgan = require("morgan");     //to log get requests
const cors = require("cors");          //cross origin requests
const bodyParser = require("body-parser");  //parse to json
const mongoose = require("mongoose");  //to connect to database
const authRoutes = require("./routes/auth");
require("dotenv").config();

const {NODE_PORT, NODE_ENV, DATABASE_URL} = process.env;     //getting required values from env file

const PORT = NODE_PORT||8000;

const isDevelopment = NODE_ENV==="development";          //just for the sake of not repeating things

if(isDevelopment){
    app.use(morgan("dev"));
}
else{
    app.use(morgan("combined"));
}

if(isDevelopment){

    app.use(cors());
}

app.use(bodyParser.json());                         //parse info in body to json

app.use(bodyParser.urlencoded({
    extended: true                                  //Read even if parameters are nested
}));

app.use("/api", authRoutes);


mongoose.connect(DATABASE_URL, {                     //connecting to mongoose - database_url from env file
    useCreateIndex: true,                           //Parameters to set to avoid errors while using older or newer Apis
    useUnifiedTopology: true,
    useFindAndModify: true,
    useNewUrlParser: true
}).then(()=>{                                       //then will only run when database is connected
  
    app.listen(PORT, ()=>{
    console.log(`DB connected and The server is running at PORT: ${PORT} - ${NODE_ENV}`);
});
})
.catch((err)=>{
    console.log("DB connection failed",err);
})         

