class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  skip_before_action :verify_authenticity_token , if: :format_json?

  def stubbed_redux_state(partial_state={})
    default_state = {
      ui: {},
      models: {
        _isReactiveRecord: true,
        CurrentUser: stubbed_reactiverecord({}),
        DogBreed: {
          _request: {
            status: nil,
            body: nil
          },
          _collection: {}
        }
      }
    }
    default_state.deep_merge(partial_state) do |key, initial_val, next_val|
      initial_val + next_val rescue next_val
    end
  end

  def stubbed_reactiverecord(record)
    {
      _request: {
        status: 200,
        body: nil
      },
      _attributes: record,
      _errors: {}
    }
  end
  protected

    def format_json?
      request.format.json?
    end
end
