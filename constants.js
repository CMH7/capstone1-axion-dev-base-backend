module.exports = {
  newMsg: (to, fullName, link) => {
    return {
      to,
      from: "axionwebdev22@gmail.com",
      template_id: "d-ea2d8bc359bb4b18ab371717cd69864b",
      dynamic_template_data: {
        fullName,
        link
      }
    }
  },
  backURI: 'https://axion-back.herokuapp.com'
}