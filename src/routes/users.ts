import express, { Router } from "express";
import { query, validationResult, matchedData } from "express-validator";
import cookieParser from 'cookie-parser';
import session from "express-session";


const router = Router();

router.get(
  "/hello",
  query("person").notEmpty().escape() as unknown as express.RequestHandler,
  (req: any, res: any) => {
    const result = validationResult(req);
    if (result.isEmpty()) {
      const data = matchedData(req);
      return res.send(`Hello, ${data.person}!`);
    }
    res.send({ errors: result.array() });
  }
);


router.get('/product', (req, res) => {
    console.log(req.session);
    console.log("SessionID: ",req.sessionID);
    req.session['visited'] = true;
    
    if (req.signedCookies.Hello === 'World') {
        res.status(201).json({ meat: 900, fish: 700, egg: 300 });
    }
        
    else
        res.status(401).json({ msg: "Wrong cookie value" });
});

export { router, cookieParser, session };
