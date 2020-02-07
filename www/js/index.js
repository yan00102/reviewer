/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const app = {
  permFolder: null,
  oldFile: null,
  permFile: null,
  reviews: [],
  KEY: "reviewer",
  num: 0,
  imgURI: "",
  permImgURI: "",
  index: 0,
  init: () => {
    //localStorage.setItem(app.KEY, ""); 
    app.getPermFolder();
    app.addListeners();
  },
  getPermFolder: () => {
    let path = cordova.file.dataDirectory;
    //save the reference to the folder as a global app property
    resolveLocalFileSystemURL(
      path,
      dirEntry => {
        //create the permanent folder
        dirEntry.getDirectory("images", {
            create: true
          }, permDir => {
            app.permFolder = permDir;
            app.getReviews();
            app.createLists();
          },
          err => {
            console.warn("failed to create or open permanent image dir");
          }
        );
      },
      err => {
        console.warn("We should not be getting an error yet");
      }
    );
  },
  loadOldImage: () => {
    //check localstorage to see if there was an old file stored
    let oldFilePath = localStorage.getItem(app.KEY);
    //if there was an old file then load it into the imgFile
    if (oldFilePath) {
      resolveLocalFileSystemURL(oldFilePath, oldFileEntry => {
          app.oldFileEntry = oldFileEntry;
          let img = document.querySelector(".review-list-img");
          img.src = oldFileEntry.nativeURL;
        },
        err => {
          console.warn(err);
        }
      );
    }
  },

  failImage: err => {
    console.warn(err);
  },

  copyImage: ev => {
    let fileName = Date.now().toString() + ".jpg";

    resolveLocalFileSystemURL(
      app.imgURI,
      entry => {
        console.log(entry);
        entry.copyTo(
          app.permFolder,
          fileName,
          permFile => {
            app.permImgURI = permFile.nativeURL;
            app.permFile = permFile;

            let msg = document.getElementById("msg").value;
            if (msg == "" || app.num == 0) {
              alert("Please fill up Title or Stars");
            } else {
              let myObj = {
                id: Date.now(),
                title: msg,
                rating: app.num,
                img: app.permImgURI,
              };
              app.reviews.push(myObj);
              //add the new object to our array reviews
              localStorage.setItem(app.KEY, JSON.stringify(app.reviews));
              //JSON.stringify converts a JavaScript object or value to a JSON string
              //completely overwrite the old version

              app.createLists();
              document.querySelector(".page.active").classList.remove("active");
              document.querySelector("#home").classList.add("active");
            }
          },
          fileErr => {
            console.warn("Copy error", fileErr);
          }
        );
      },
      err => {
        console.error(err);
      }
    );
  },
  getReviews: () => {
    if (localStorage.getItem(app.KEY)) {
      //if localStorage.getItem(app.KEY) != "";
      let str = localStorage.getItem(app.KEY);
      app.reviews = JSON.parse(str);
      //convert string to JS object
    }
  },

  addListeners: () => {
    //from Home to load camera || Add
    document.getElementById("btnAdd").addEventListener("click", app.takephotos);
    //from Add to Home -- save -- setLocalStorage
    document.getElementById("btnSave").addEventListener("click", app.copyImage);
    //from Add to Home -- cancel
    document.getElementById("btnCancel").addEventListener("click", app.nav);
    //from Details to Home
    document.getElementById("btnDetailsBack").addEventListener("click", app.nav);
    //click delete button to Home
    document.getElementById("btnDelete").addEventListener("click", app.updateLocalStorage);
  },

  nav: ev => {
    let btn = ev.currentTarget;
    let target = btn.getAttribute("data-target");
    if (target == "add") {
      app.rating();
    }
    document.querySelector(".page.active").classList.remove("active");
    document.getElementById(target).classList.add("active");
  },

  findImg: (ev) => {
    link = ev.currentTarget;
    targetId = link.getAttribute("data-review-id");
    app.nav(ev);

    app.index = app.reviews.findIndex(item => item.id == targetId);
    document.querySelector('.details-photo').src = app.reviews[app.index].img;
    document.querySelector('.details-photo').alt = app.reviews[app.index].title;
    document.querySelector('.details-title').textContent = app.reviews[app.index].title;

    let stars = document.getElementById('detailStars')
    stars.innerHTML = ''
    let rating = app.reviews[app.index].rating

    for (let i = 0; i < rating; i++) {
      let star = document.createElement('span')
      star.className = 'Dstar rated'
      stars.appendChild(star)
    }

  },


  rating: () => {
    //Star Rating System
    let stars = document.querySelectorAll(".star");
    stars.forEach(function (star) {
      star.addEventListener("click", setRating);
    });

    function setRating(ev) {
      let span = ev.currentTarget;
      let stars = document.querySelectorAll(".star");
      let match = false;
      stars.forEach(function (star, index) {
        if (match) {
          star.classList.remove("rated");
        } else {
          star.classList.add("rated");
        }
        //are we currently looking at the span that was clicked
        if (star === span) {
          match = true;
          app.num = index + 1;
        }
      });
      document.querySelector(".stars").setAttribute("data-rating", app.num);
      // console.log(app.num); //how many stars
      // console.log(stars); //stars is obj
    }
  },

  takephotos: (ev) => {
    // let test = [];
    // if (!test) {
    //   // assume !+[] = true, but it's false 
    //   console.log("this is test !!!!!!!!")
    // }else{
    //   console.log("this is else...............")
    // }
    document.getElementById("msg").value = "";
    let opts = {
      quality: 100,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.CAMERA,
      //camera.getPicture函数打开设备的默认相机应用程序，该应用程序默认允许用户拍摄照片, 用户拍摄完照片后，相机应用程序将关闭并恢复该应用程序
      mediaType: Camera.MediaType.PICTURE,
      encodingType: Camera.EncodingType.JPEG,
      cameraDirection: Camera.Direction.BACK
    };
    navigator.camera.getPicture(app.ftw, app.wtf, opts);
    //camera.getPicture(successCallback, errorCallback, options)
    app.nav(ev);
    //take photo then go Add
  },

  ftw: (imgURI) => {
    document.querySelector(".add-photo").src = imgURI;
    app.imgURI = imgURI;
  },

  wtf: (msg) => {
    document.querySelector(".details-title").textContent = msg;
  },

  createLists: () => {
    let reviewList = document.querySelector(".review-list");
    reviewList.innerHTML = "";

    if (app.reviews.length == 0) {
      let p = document.createElement("p");
      p.className = "navText";
      p.textContent = "Please click Add button to take photos and upload";
      reviewList.appendChild(p);
    } else {
      app.reviews.forEach(obj => {
        let name = document.createElement("figcaption");
        let img = document.createElement("img");
        let div = document.createElement("div");
        div.addEventListener("click", app.findImg);

        name.className = "review-list-fig";
        img.className = "review-list-img";
        div.className = "review-img";
        name.textContent = obj.title;
        img.src = obj.img;
        img.alt = obj.title;
        div.setAttribute("data-review-id", obj.id);
        div.setAttribute("data-target", "details");
        div.appendChild(img);
        div.appendChild(name);
        reviewList.appendChild(div);
      })
    }

  },

  updateLocalStorage: (ev) => {
    app.reviews.splice(app.index, 1);
    localStorage.setItem(app.KEY, JSON.stringify(app.reviews));
    app.createLists();
    app.nav(ev);
  }
}

const ready = "cordova" in window ? "deviceready" : "DOMContentLoaded";
document.addEventListener(ready, app.init);