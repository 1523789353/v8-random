import { Random } from "./random";

let r = new Random(114514);
console.log(r.nextBoolean());
r = new Random(114514);
console.log(r.nextInt());
r = new Random(114514);
console.log(r.nextLong());
r = new Random(114514);
console.log(r.nextFloat());
r = new Random(114514);
console.log(r.nextDouble());
r = new Random(114514);
console.log(r.nextUUIDv4().toString());

console.log("##########")

r = new Random(114514);
for (let i = 0; i < 10; i++) {
    console.log(r.nextInt())
}
