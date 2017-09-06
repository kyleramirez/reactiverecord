class CreateDogBreeds < ActiveRecord::Migration[5.1]
  def change
    create_table :dog_breeds do |t|
      t.string :name
      t.text :description
      t.boolean :akc_recognized
      t.timestamps
    end
  end
end
