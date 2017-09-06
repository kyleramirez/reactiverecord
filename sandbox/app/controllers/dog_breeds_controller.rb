class DogBreedsController < ApplicationController
  before_action :set_last_modified

  rescue_from ActiveRecord::RecordNotFound do
    render status: :not_found, json: { body: "Not Found." }
  end

  def index
    render json: DogBreed.all, status: :ok
  end

  def create
    breed = DogBreed.new(dog_breed_params)
    if breed.save
      render json: breed, status: :accepted
    else
      render json: { errors: breed.errors.messages }, status: :unprocessable_entity
    end
  end

  def show
    render json: dog_breed, status: :ok
  end

  def update
    if dog_breed.update_attributes(dog_breed_params)
      render json: dog_breed, status: :accepted
    else
      render json: { errors: dog_breed.errors.messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if dog_breed.destroy
      render json: {}, status: :no_content
    else
      render json: { errors: dog_breed.errors.messages }, status: :unprocessable_entity
    end
  end

  protected
    def dog_breed_params
      params.permit(:name, :description, :akc_recognized)
    end

    def dog_breed
      @dog_breed ||= DogBreed.find(params[:id])
    end

    def set_last_modified
      headers["Cache-Control"] = "no-cache, no-store, max-age=0, must-revalidate"
      headers["Pragma"] = "no-cache"
      headers["Expires"] = "Fri, 01 Jan 1990 00:00:00 GMT"
    end
end
