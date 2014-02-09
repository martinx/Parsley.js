define(function () {
  return function (ParsleyField, Parsley) {
    describe('ParsleyField', function () {
      it('should be an function', function () {
        expect(ParsleyField).to.be.a('function');
      });
      it('should throw an error if no parsleyInstance given', function () {
        expect(ParsleyField).to.throwException();
      });
      it('should properly bind DOM constraints', function () {
        $('body').append('<input type="text" id="element" data-parsley-required />');
        var parsleyField = new Parsley($('#element'));
        expect(parsleyField.constraints.length).to.be(1);
        expect(parsleyField.constraints[0].__class__).to.be('Required');
        expect(parsleyField.constraints[0].__parentClass__).to.be('Assert');
        expect(parsleyField.constraints[0].name).to.be('required');
        expect(parsleyField.constraints[0].isDomConstraint).to.be(true);
      });
      it('should properly bind HTML DOM supported constraints', function () {
        $('body').append('<input type="email" id="element" />');
        var parsleyField = new Parsley($('#element'));
        expect(parsleyField.constraints.length).to.be(1);
        expect(parsleyField.constraints[0].__class__).to.be('Email');
        expect(parsleyField.constraints[0].__parentClass__).to.be('Assert');
        expect(parsleyField.constraints[0].name).to.be('type');
        expect(parsleyField.constraints[0].isDomConstraint).to.be(true);
      });
      it('should have a proper addConstraint() javascript method', function () {
        $('body').append('<input type="text" id="element" />');
        var parsleyField = new Parsley($('#element'))
          .addConstraint('required', true);
        expect(parsleyField.constraints.length).to.be(1);
        expect(parsleyField.constraints[0].__class__).to.be('Required');
        expect(parsleyField.constraints[0].__parentClass__).to.be('Assert');
        expect(parsleyField.constraints[0].name).to.be('required');
        expect(parsleyField.constraints[0].requirements).to.be(true);
        expect(parsleyField.constraints[0].priority).to.be(512);
        expect(parsleyField.constraints[0].isDomConstraint).to.be(false);

        // trying to add an existing constraint result in an update
        parsleyField.addConstraint('required', false, 64);
        expect(parsleyField.constraints.length).to.be(1);
        expect(parsleyField.constraints[0].name).to.be('required');
        expect(parsleyField.constraints[0].requirements).to.be(false);
        expect(parsleyField.constraints[0].priority).to.be(64);
      });
      it('should have a proper updateConstraint() javascript method', function () {
        $('body').append('<input type="text" id="element" />');
        var parsleyField = new Parsley($('#element'))
          .addConstraint('required', true);

        // same as above test where addConstraint resulted in an updateConstraint
        parsleyField.updateConstraint('required', false, 64);
        expect(parsleyField.constraints.length).to.be(1);
        expect(parsleyField.constraints[0].name).to.be('required');
        expect(parsleyField.constraints[0].requirements).to.be(false);
        expect(parsleyField.constraints[0].priority).to.be(64);
      });
      it('should have a proper removeConstraint() javascript method', function () {
        $('body').append('<input type="text" id="element" />');
        var parsleyField = new Parsley($('#element'))
          .addConstraint('required', true)
          .addConstraint('notblank', true)
          .removeConstraint('required');
        expect(parsleyField.constraints.length).to.be(1);
        expect(parsleyField.constraints[0].name).to.be('notblank');
      });
      it('should return an empty array for fields withoud constraints', function () {
        $('body').append('<input type="text" id="element" value="" />');
        expect(new Parsley($('#element')).isValid()).to.eql([]);
      });
      it('should valid simple validator', function () {
        $('body').append('<input type="text" id="element" value="" />');
        var parsleyField = new Parsley($('#element'))
          .addConstraint('required', true);
        expect(parsleyField.isValid()).to.be(false);
        $('#element').val('foo');
        expect(parsleyField.isValid()).to.be(true);
      });
      it('should valid more complex `type` validator', function () {
        $('body').append('<input type="text" id="element" value="foo" />');
        var parsleyField = new Parsley($('#element'))
          .addConstraint('type', 'email');
        expect(parsleyField.isValid()).to.be(false);
        $('#element').val('foo');
        expect(parsleyField.isValid()).to.be(false);
        $('#element').val('foo@bar.baz');
        expect(parsleyField.isValid()).to.be(true);
      });
      it('should valid most complex Callback() validator', function () {
        $('body').append('<input type="text" id="element" value="" />');
        ParsleyValidator.addValidator('multiple', function (value, multiple) {
          if (!isNaN(parseFloat(value)) && isFinite(value))
            return !(new Number(value) % multiple);

          return false;
        }, 512);

        var parsleyField = new Parsley($('#element'))
          .addConstraint('multiple', 2);
        expect(parsleyField.isValid()).to.eql([]);
        $('#element').val('1');
        expect(parsleyField.isValid()).to.be(false);
        $('#element').val('2');
        expect(parsleyField.isValid()).to.be(true);
        parsleyField.updateConstraint('multiple', 3);
        expect(parsleyField.isValid()).to.be(false);
        $('#element').val('9');
        expect(parsleyField.isValid()).to.be(true);
      });
      it('should properly compute constraints on each validation', function () {
        $('body').append('<input type="email" data-parsley-required id="element" />');
        ParsleyValidator.addValidator('foobazer', function (value) {
          return 'foobar' === value;
        }, 2);

        var parsleyField = new Parsley($('#element'))
          .addConstraint('multiple', 4)
          .addConstraint('foobazer', true);
        parsleyField.bindConstraints();
        expect(parsleyField.constraints.length).to.be(4);
        $('#element').removeAttr('data-parsley-required');
        parsleyField.refreshConstraints();
        expect(parsleyField.constraints.length).to.be(3);
        parsleyField
          .removeConstraint('multiple')
          .refreshConstraints();
        expect(parsleyField.constraints.length).to.be(2);
      });
      it('should handle constraints priorities on validation', function () {
        $('body').append('<input type="email" pattern="[A-F][0-9]{5}" required id="element" />');
        parsleyField = new Parsley($('#element'));
        expect(parsleyField.isValid()).to.be(false);
        expect(parsleyField.validationResult.length).to.be(1);
        expect(parsleyField.validationResult[0].assert.name).to.be('required');
        $('#element').val('foo');
        expect(parsleyField.isValid()).to.be(false);
        expect(parsleyField.validationResult.length).to.be(1);
        expect(parsleyField.validationResult[0].assert.name).to.be('type');
        $('#element').val('foo@bar.baz');
        expect(parsleyField.isValid()).to.be(false);
        expect(parsleyField.validationResult.length).to.be(1);
        expect(parsleyField.validationResult[0].assert.name).to.be('pattern');
      });
      it('should handle all violations if `priorityEnabled` is set to false', function () {
        $('body').append('<input type="email" pattern="[A-F][0-9]{5}" required id="element" />');
        parsleyField = new Parsley($('#element'), { priorityEnabled: false });
        expect(parsleyField.isValid()).to.be(false);
        expect(parsleyField.validationResult.length).to.be(3);
      });
      it('should fire parsley:field:validate event', function (done) {
        $('body').append('<input type="email" pattern="[A-F][0-9]{5}" required id="element" />');
        $.listenTo($('#element').psly(), 'parsley:field:validate', function (instance) {
          // we are before validation!
          expect(instance.validationResult.length).to.be(0);
          done();
        });
        $('#element').psly().validate();
      });
      it('should fire parsley:field:validated event', function (done) {
        $('body').append('<input type="email" pattern="[A-F][0-9]{5}" required id="element" />');
        $.listenTo($('#element').psly(), 'parsley:field:validated', function (instance) {
          // we are after validation!
          expect(instance.validationResult.length).to.be(1);
          done();
        });
        $('#element').psly().validate();
      });
      it('should fire parsley:field:error event', function (done) {
        $('body').append('<input type="email" pattern="[A-F][0-9]{5}" required id="element" />');
        $.listenTo($('#element').psly(), 'parsley:field:error', function (instance) {
          expect(instance.validationResult.length).to.be(1);
          done();
        });
        $('#element').psly().validate();
      });
      it('should fire parsley:field:success event', function (done) {
        $('body').append('<input type="email" required id="element" value="foo@bar.baz" />');
        $.listenTo($('#element').psly(), 'parsley:field:success', function (instance) {
          expect(instance.validationResult).to.be(true);
          done();
        });
        $('#element').psly().validate();
      });
      afterEach(function () {
        window.ParsleyConfig = { i18n: window.ParsleyConfig.i18n };

        if ($('#element').length)
          $('#element').remove();
        if ($('.parsley-errors-list').length)
          $('.parsley-errors-list').remove();
      });
    });
  }
});