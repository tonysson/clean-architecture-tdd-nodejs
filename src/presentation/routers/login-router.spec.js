const LoginRouter = require('./login-router');
const MissingParamError = require('../helpers/missing-param-error')
const UnauthorizedError = require('../helpers/unauthorized-error');
const ServerError = require('../helpers/servor-error');
const InvalidParamError = require('../helpers/invalid-param-error');

const makeSut = () => {
   // extenciate the AuthUseCaseSpy class
   const authUseCaseSpy = makeAuthUseCase()
   authUseCaseSpy.accessToken = "valid_token"

   //instanciate makeEmailValidator
   const emailValidatorSpy =   makeEmailValidator()

   // extenciate the loginRouter class
   const sut = new LoginRouter(authUseCaseSpy , emailValidatorSpy)

   return {
      sut ,
      authUseCaseSpy,
      emailValidatorSpy
   }
}

const makeEmailValidator = () => {

   class EmailValidatorSpy {
      isValid(email){
         this.email = email
        return this.isEmailValid
      }

   }

   const emailValidatorSpy =    new EmailValidatorSpy()
   emailValidatorSpy.isEmailValid =  true
   return emailValidatorSpy
}

const makeEmailValidatorWithError = () => {
   class EmailValidatorSpy {
        isValid() {
         throw new Error()
         }
      }

      return new EmailValidatorSpy()
}

const makeAuthUseCase = () => {
     class AuthUseCaseSpy {
       async  auth(email , password) {
        this.email = email
        this.password = password
        return this.accessToken
       }
   }

    const authUseCaseSpy = new AuthUseCaseSpy()
    authUseCaseSpy.accessToken = 'invalid_token'
     return new AuthUseCaseSpy()

}

const makeAuthUseCaseWithError = () => {
   class AuthUseCaseSpy {
       async  auth() {
         throw new Error()
         }
      }

      return new AuthUseCaseSpy()
}

describe('Login Route' , () => {

    test('should return 400 if no email is provided' , async  () => {
       const   {sut }= makeSut()
       const httpRequest = {body:{ password : 'any_password'}}
       const httpResponse =  await sut.route(httpRequest)
       expect(httpResponse.statusCode).toBe(400)
       expect(httpResponse.body).toEqual(new MissingParamError('email'))

    })

    test('should return 400 if no password is provided' , async () => {
       const   {sut} = makeSut()
       const httpRequest = {body:{email : 'any_email@mail.com'}}
       const httpResponse = await  sut.route(httpRequest)
       expect(httpResponse.statusCode).toBe(400)
       expect(httpResponse.body).toEqual(new MissingParamError('password'))
    })

     test('should return 500 if no httpRequest is provided' , async () => {
        const  { sut} = makeSut()
       const httpResponse =  await  sut.route()
       expect(httpResponse.statusCode).toBe(500)
       expect(httpResponse.body).toEqual(new ServerError())
    })

     test('should return 500 if  httpRequest has no body' , async () => {
        const   {sut} = makeSut()
       const httpResponse = await  sut.route({})
       expect(httpResponse.statusCode).toBe(500)
       expect(httpResponse.body).toEqual(new ServerError())
    })

    test('should call AuthUseCaseSpy with correct param' , () => {
       const  { sut , authUseCaseSpy} = makeSut()
      const httpRequest = {
         body:
         {
            email : 'any_email@mail.com', 
             password:"any_password"
         }
      }
        sut.route(httpRequest)
       expect(authUseCaseSpy.email).toBe(httpRequest.body.email)
       expect(authUseCaseSpy.password).toBe(httpRequest.body.password)
    })

    
    test('should return 401 when invalid credentials are provided' ,  async () => {
       const  { sut , authUseCaseSpy } = makeSut()
       authUseCaseSpy.accessToken = null
      const httpRequest = {
         body:
         {
            email : 'invalid_email@mail.com', 
             password:"invalid_password"
         }
      }
       const httpResponse = await  sut.route(httpRequest)
       expect(httpResponse.statusCode).toBe(401)
       expect(httpResponse.body).toEqual(new UnauthorizedError())
    })

    test('Should return 200 when valid credentials are provided', async () => {
    const { sut, authUseCaseSpy } = makeSut()
    const httpRequest = {
      body: {
        email: 'valid_email@mail.com',
        password: 'valid_password'
      }
    }
    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(200)
    expect(httpResponse.body.accessToken).toBe(authUseCaseSpy.accessToken)
  })

    test('should return 500 if no AuthUseCase is provided' , async () => {
       const sut  = new LoginRouter()
       const httpRequest = {
         body:
         {
            email : 'any_email@mail.com', 
             password:"any_password"
         }
      }
       const httpResponse =  await  sut.route(httpRequest)
       expect(httpResponse.statusCode).toBe(500)
       expect(httpResponse.body).toEqual(new ServerError())

    })

    test('should return 500 if no AuthUseCase has no auth method' , async () => {

         const sut = new LoginRouter({})
         const httpRequest = {
            body:
            {
               email : 'any_email@mail.com', 
               password:"any_password"
            }
         }
         const httpResponse =  await sut.route(httpRequest)
         expect(httpResponse.statusCode).toBe(500)
         expect(httpResponse.body).toEqual(new ServerError())

    })

    test('should return 500 if no AuthUseCase throws' , async () => {
      // extenciate the AuthUseCaseSpy class
      const authUseCaseSpy = makeAuthUseCaseWithError()
      const sut = new LoginRouter(authUseCaseSpy)
            const httpRequest = {
               body:
               {
                  email : 'any_email@mail.com', 
                  password:"any_password"
               }
            }
         const httpResponse = await sut.route(httpRequest)
         expect(httpResponse.statusCode).toBe(500)

    })

    test('should return 400 if an invalid email is provided' , async  () => {
       const   {sut , emailValidatorSpy }= makeSut()
       emailValidatorSpy.isEmailValid = false
       const httpRequest = {
          body:{ email : 'invalid_email@mail.com' , password: 'any_password'}
         }
       const httpResponse =  await sut.route(httpRequest)
       expect(httpResponse.statusCode).toBe(400)
       expect(httpResponse.body).toEqual(new InvalidParamError('email'))

    })

    test('should return 500 if no EmailValidator is provided' , async () => {
       const authUseCaseSpy = makeAuthUseCase()
       const sut  = new LoginRouter(authUseCaseSpy)
       const httpRequest = {
         body:
         {
            email : 'any_email@mail.com', 
             password:"any_password"
         }
      }
       const httpResponse =  await  sut.route(httpRequest)
       expect(httpResponse.statusCode).toBe(500)
       expect(httpResponse.body).toEqual(new ServerError())

    })

    test('should return 500 if no EmailValidator has no isValid method is provided' , async () => {
       const authUseCaseSpy = makeAuthUseCase()
       const sut  = new LoginRouter(authUseCaseSpy, {})
       const httpRequest = {
         body:
         {
            email : 'any_email@mail.com', 
             password:"any_password"
         }
      }
       const httpResponse =  await  sut.route(httpRequest)
       expect(httpResponse.statusCode).toBe(500)
       expect(httpResponse.body).toEqual(new ServerError())

    })

    test('should return 500 if no EmailValidator throws' , async () => {
       const authUseCaseSpy = makeAuthUseCase()
       const emailValidatorSpy = makeEmailValidatorWithError()
       const sut  = new LoginRouter(authUseCaseSpy , emailValidatorSpy)
       const httpRequest = {
         body:
         {
            email : 'any_email@mail.com', 
             password:"any_password"
         }
      }
       const httpResponse =  await  sut.route(httpRequest)
       expect(httpResponse.statusCode).toBe(500)
    })

    test('should call EmailValidator with correct email' , () => {
       const  { sut , emailValidatorSpy} = makeSut()
      const httpRequest = {
         body:
         {
            email : 'any_email@mail.com', 
             password:"any_password"
         }
      }
        sut.route(httpRequest)
       expect(emailValidatorSpy.email).toBe(httpRequest.body.email)
    })
})











