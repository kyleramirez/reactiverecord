class WelcomeController < ApplicationController
  def home
    @INITIAL_STATE = stubbed_redux_state
  end

  def index
    @INITIAL_STATE = stubbed_redux_state({
      models: {
        DogBreed: {
          _request: {
            status: 200
          },
          _collection: DogBreed.all.map{|b| stubbed_reactiverecord(b) }.index_by{|b| b[:_attributes].id }
        }
      }
    })
    render partial: "react_page_prerendered", layout: false
  end

  def new
    @INITIAL_STATE = stubbed_redux_state
    render partial: "react_page_prerendered", layout: false
  end

  def show
    @INITIAL_STATE = stubbed_redux_state({
      models: {
        DogBreed: {
          _request: {
            status: 200
          },
          _collection: DogBreed.where(id: params[:id]).map{|b| stubbed_reactiverecord(b) }.index_by{|b| b[:_attributes].id }
        }
      }
    })
    render partial: "react_page_prerendered", layout: false
  end

  def edit
    @INITIAL_STATE = stubbed_redux_state({
      models: {
        DogBreed: {
          _request: {
            status: 200
          },
          _collection: DogBreed.where(id: params[:id]).map{|b| stubbed_reactiverecord(b) }.index_by{|b| b[:_attributes].id }
        }
      }
    })
    render partial: "react_page_prerendered", layout: false
  end

end
