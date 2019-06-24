console.log("the old way "+Date.now());

console.log("the UTC way "+parseInt(new Date().getTime()/1000))


var datum = new Date(Date.UTC('2018','02','18','02','18','18'));
var genBlockTimestamp = datum.getTime()/1000;

console.log("the gen block way "+genBlockTimestamp);
