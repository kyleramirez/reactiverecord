class WelcomeController < ApplicationController
  protect_from_forgery with: :exception

  def home
    @props = {
      one: "two",
      three: "four",
      five: "six"
    }
  end
end
