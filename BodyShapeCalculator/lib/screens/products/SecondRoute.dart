import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_myntra_clone/common_widgets/back_button.dart' as bb;
import 'package:flutter_myntra_clone/common_widgets/cached_image.dart';
import 'package:flutter_myntra_clone/common_widgets/primary_button.dart';
import 'package:flutter_myntra_clone/screens/home_screen.dart';
import 'package:flutter_myntra_clone/screens/login/otp.dart';
import 'package:flutter_myntra_clone/utils/asset_constants.dart';
import 'package:pin_code_fields/pin_code_fields.dart';


class SecondRoute extends StatefulWidget {
  static const routeName = '/SecondRoute';
  String name;



  @override
  _SecondRouteState createState() => _SecondRouteState();
}

class _SecondRouteState extends State<SecondRoute> {
  final _form = GlobalKey<FormState>();
  int _dressSize ;
  int _breastSize ;
  int _waistSize;
  int _hipSize;
  int _weight;
  String bodyType = "Hry";
 String url = "assets/images/Hourglass.png";

  var tcVisibility = false;


      String get name => null;


  void _validateAndLogin(BuildContext ctx) async {
    final isValid = _form.currentState.validate();
    if (!isValid) {
      return;
    }
    _form.currentState.save();

  //  Navigator.of(context)
    //    .pushNamed(Otp.routeName, arguments: _dressSize);
  }
  void showWidget(){
    setState(() {
      bodyType = setColor();

      tcVisibility = true ;

    });
  }
  String setColor() {
    if (_waistSize * 1.25 <= _breastSize & _hipSize) {
      url = "assets/images/Hourglass.png";
      return "Hourglass";

    }
    else if (_hipSize * 1.05 > _breastSize) {
      url = "assets/images/Pear.png";
      return "Pear";

    }
    else if (_hipSize * 1.05 < _breastSize) {
      url = "assets/images/apple.png";
      return "Apple";
    }
    else {
      url = "assets/images/Rectangle.png";
      return "Rectangle";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: GestureDetector(
        onTap: () {
          FocusScope.of(context).requestFocus(FocusNode());
        },
        child: Builder(
          builder: (ctx) => SafeArea(
            child: SingleChildScrollView(
              child: Stack(
                children: [
                  Positioned(
                    top: 18,
                    left: 18,
                    child: bb.BackButton(),
                  ),
                  Padding(
                    padding: EdgeInsets.all(60),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CachedImage(
                          url: 'https://www.nm.org/-/media/northwestern/healthbeat/images/healthy-tips/fitness/nm-busting-body-type-myths_body-types.jpg',
                          height: 187.5,
                          width: 300,
                        ),
                        SizedBox(
                          height: 20,
                        ),
                        Text(
                          'The Body Shape Quiz',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(
                          height: 10,
                        ),
                        Text(
                          '"The dress must follow the body of a woman, not the body following the shape of the dress "cited by Hubert De Givenchy. ',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                        SizedBox(
                          height: 40,
                        ),
                        SizedBox(
                          height: 20,
                        ),
                        Form(
                          key: _form,
                          child:Column(
                              children: <Widget>[
                                TextFormField(
                            decoration: InputDecoration(
                              contentPadding: EdgeInsets.all(10),
                              enabledBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: Colors.grey,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: Colors.black,
                                ),
                              ),
                              border: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: Colors.grey,
                                ),
                              ),
                              labelText: 'Dress Size',
                              labelStyle: TextStyle(
                                color: Colors.grey,
                              ),
                              alignLabelWithHint: true,
                              errorStyle: TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            onFieldSubmitted: (_) => _validateAndLogin(ctx),
                            keyboardType: TextInputType.number,
                            textInputAction: TextInputAction.done,
                            validator: (value) =>
                                validation(value),
                            onSaved: (value) {
                              _dressSize = int.parse(value);
                            },
                          ),
                                SizedBox(
                                  height: 20,
                                ),
                          TextFormField(
                            decoration: InputDecoration(
                              contentPadding: EdgeInsets.all(10),
                              enabledBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: Colors.grey,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: Colors.black,
                                ),
                              ),
                              border: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: Colors.grey,
                                ),
                              ),
                              labelText: 'Weight',
                              labelStyle: TextStyle(
                                color: Colors.grey,
                              ),
                              alignLabelWithHint: true,
                              errorStyle: TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            onFieldSubmitted: (_) => _validateAndLogin(ctx),
                            keyboardType: TextInputType.number,
                            textInputAction: TextInputAction.done,
                            validator: (value) =>
                                validation(value),
                            onSaved: (value) {
                              _weight = int.parse(value);
                            },
                          ),
                                SizedBox(
                                  height: 20,
                                ),
                                TextFormField(
                                  decoration: InputDecoration(
                                    contentPadding: EdgeInsets.all(10),
                                    enabledBorder: OutlineInputBorder(
                                      borderSide: BorderSide(
                                        color: Colors.grey,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderSide: BorderSide(
                                        color: Colors.black,
                                      ),
                                    ),
                                    border: OutlineInputBorder(
                                      borderSide: BorderSide(
                                        color: Colors.grey,
                                      ),
                                    ),
                                    labelText: 'Bust Size',
                                    labelStyle: TextStyle(
                                      color: Colors.grey,
                                    ),
                                    alignLabelWithHint: true,
                                    errorStyle: TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  onFieldSubmitted: (_) => _validateAndLogin(ctx),
                                  keyboardType: TextInputType.number,
                                  textInputAction: TextInputAction.done,
                                  validator: (value) =>
                                      validation(value),
                                  onSaved: (value) {
                                    _breastSize = int.parse(value);
                                  },
                                ),
                                SizedBox(
                                  height: 20,
                                ),
                                TextFormField(
                                  decoration: InputDecoration(
                                    contentPadding: EdgeInsets.all(10),
                                    enabledBorder: OutlineInputBorder(
                                      borderSide: BorderSide(
                                        color: Colors.grey,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderSide: BorderSide(
                                        color: Colors.black,
                                      ),
                                    ),
                                    border: OutlineInputBorder(
                                      borderSide: BorderSide(
                                        color: Colors.grey,
                                      ),
                                    ),
                                    labelText: 'Waist Size',
                                    labelStyle: TextStyle(
                                      color: Colors.grey,
                                    ),
                                    alignLabelWithHint: true,
                                    errorStyle: TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  onFieldSubmitted: (_) => _validateAndLogin(ctx),
                                  keyboardType: TextInputType.number,
                                  textInputAction: TextInputAction.done,
                                  validator: (value) =>
                                      validation(value),
                                  onSaved: (value) {
                                    _waistSize = int.parse(value);
                                  },
                                ),
                                SizedBox(
                                  height: 20,
                                ),
                                TextFormField(
                                  decoration: InputDecoration(
                                    contentPadding: EdgeInsets.all(10),
                                    enabledBorder: OutlineInputBorder(
                                      borderSide: BorderSide(
                                        color: Colors.grey,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderSide: BorderSide(
                                        color: Colors.black,
                                      ),
                                    ),
                                    border: OutlineInputBorder(
                                      borderSide: BorderSide(
                                        color: Colors.grey,
                                      ),
                                    ),
                                    labelText: 'Hip size',
                                    labelStyle: TextStyle(
                                      color: Colors.grey,
                                    ),
                                    alignLabelWithHint: true,
                                    errorStyle: TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  onFieldSubmitted: (_) => _validateAndLogin(ctx),
                                  keyboardType: TextInputType.number,
                                  textInputAction: TextInputAction.done,
                                  validator: (value) =>
                                      validation(value),
                                  onSaved: (value) {
                                    _hipSize = int.parse(value);
                                  },
                                ),
                                SizedBox(
                                  height: 20,
                                ),
                        ],
                          ),
                        ),
                       // Container(
                         // width: double.infinity,
                         // child: ButtonTheme(
                           // child: PrimaryButton(
                             // title: 'CONTINUE',
                             // onPressed: () =>  {
                             // _validateAndLogin(ctx),
                            //  setState(() {
                           //   tcVisibility = true,
                             // }),
                             // _navigateToNextScreen(context),
                             //   bodyType =setColor(),
                             //   print(bodyType)
                           //   }
                          //    )
                             //if ()_validateAndLogin(ctx),
                         //   ),
                      //    ),
                        RaisedButton(
                          child: Text('Enter -> '),
                          onPressed: (){

                            _validateAndLogin(ctx);
                         // bodyType =setColor();
                          showWidget();
                          },
                          color: Colors.pink,
                          textColor: Colors.white,
                          padding: EdgeInsets.fromLTRB(10, 10, 10, 10),
                        ),

                        Visibility(
                          visible: tcVisibility ,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              SizedBox(
                                width: 10,
                              ),

                              Text(bodyType,
                                style: TextStyle(fontSize: 40
                                ),

                              ),
                            //  SizedBox(
                              //  height:10,
                               // width:10 ,
                            //  ),

                             //   AssetImage('assets/images/Hourglass.png'),
                             // new Container(
                               // color: Colors.grey[200],
                               // child: new Image.asset('assets/images/Hourglass.jpg'),
                              //  alignment: Alignment.center,
                              //),
                              Image(
                                width:500 ,
                                height: 800,
                                image: AssetImage(url),
                              ),

                             //CachedImage(
                               // Image.asset('assets/images/Hourglass.jpg'),
                            //   placeholder: AssetImage('assets/images/Hourglass.jpg'),
                              //  url: 'https://www.nm.org/-/media/northwestern/healthbeat/images/healthy-tips/fitness/nm-busting-body-type-myths_body-types.jpg',
                                // height: 187.5,
                                //width: 300,
                            //  ),
                             //   Image.asset('assets/images/Hourglass.jpg'),
                               // imageUrl: 'assests/images/Hourglass.png',
                            //  Cache image
                            //    url: 'https://www.nm.org/-/media/northwestern/healthbeat/images/healthy-tips/fitness/nm-busting-body-type-myths_body-types.jpg',
                              //  height: 187.5,
                               // width: 300,
                              ],

                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
  String validation(value) {
    if (value.isEmpty) {
      return 'Please enter a valid details';
    }
    if (value.length > 3) {
      return 'Please enter a valid details';
    }
    if (int.tryParse(value) == null) {
      return 'Please enter a valid details';
    }
    return null;
  }


  void _navigateToNextScreen(BuildContext context) {
    Navigator.of(context).push(MaterialPageRoute(builder: (context) => NewScreen()));
  }
}



class NewScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(

      appBar: AppBar(title: Text('Your Body Type')),
      body: Center(
      //  String name = setColor(),
        child: Text(
          'This is a new screen',
          style: TextStyle(fontSize: 24.0),
        ),

      ),

    );

  }
}
