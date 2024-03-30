const {format}=require('date-fns');
const getTimestamp=()=>{
    return format(new Date(),'yyyyMMddHHmmss');
}
const getPassword = (shortCode,passkey,timestamp) => {
    const str = shortCode + passkey + timestamp;
    return Buffer.from(str).toString('base64');


}
module.exports = {getTimestamp,getPassword};